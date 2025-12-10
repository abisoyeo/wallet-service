// src/wallet/wallet.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as crypto from 'crypto';
import { Wallet } from './schemas/wallet.schema';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './schemas/transaction.schema';
import { PaystackService } from './paystack.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
    @InjectConnection() private connection: Connection,
    private paystackService: PaystackService,
  ) {}

  // --- HELPER: Get or Create Wallet ---
  async ensureWallet(userId: string) {
    let wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      wallet = await this.walletModel.create({
        userId,
        walletNumber: crypto.randomInt(1000000000, 9999999999).toString(),
        balance: 0,
      });
    }
    return wallet;
  }

  // --- 1. DEPOSIT INITIALIZATION ---
  async initiateDeposit(userId: string, email: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    // 1. Call Paystack
    const paystackData = await this.paystackService.initializeTransaction(
      email,
      amount,
    );

    // 2. Log "Pending" Transaction
    await this.txModel.create({
      userId,
      reference: paystackData.reference,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
    });

    return paystackData;
  }

  // --- 2. WEBHOOK HANDLER (MANDATORY) ---
  async handleWebhook(signature: string, event: any) {
    // A. Security Check
    if (!this.paystackService.verifySignature(signature, event)) {
      throw new ForbiddenException('Invalid signature');
    }

    // We only care about success
    if (event.event !== 'charge.success') return { status: true };

    const { reference, amount } = event.data;
    // Paystack sends amount in Kobo, convert back if your DB uses Naira
    const realAmount = amount / 100;

    // B. Idempotency & Atomicity
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Find the transaction
      const tx = await this.txModel.findOne({ reference }).session(session);

      if (!tx) {
        // Log "orphan" transaction if needed, or ignore
        await session.abortTransaction();
        return { status: true };
      }

      // 2. IDEMPOTENCY CHECK: If already success, stop.
      if (tx.status === TransactionStatus.SUCCESS) {
        await session.abortTransaction();
        return { status: true };
      }

      // 3. Update Transaction Status
      tx.status = TransactionStatus.SUCCESS;
      await tx.save({ session });

      // 4. Credit Wallet
      await this.walletModel
        .updateOne({ userId: tx.userId }, { $inc: { balance: realAmount } })
        .session(session);

      await session.commitTransaction();
      return { status: true };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // --- 3. TRANSFER (Atomic) ---
  async transferFunds(
    senderId: string,
    recipientWalletNum: string,
    amount: number,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Get Sender Wallet
      const senderWallet = await this.walletModel
        .findOne({ userId: senderId })
        .session(session);
      if (!senderWallet || senderWallet.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // 2. Get Recipient Wallet
      const recipientWallet = await this.walletModel
        .findOne({ walletNumber: recipientWalletNum })
        .session(session);
      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      // 3. Deduct Sender
      senderWallet.balance -= amount;
      await senderWallet.save({ session });

      // 4. Credit Recipient
      recipientWallet.balance += amount;
      await recipientWallet.save({ session });

      // 5. Log Transaction (Sender View)
      await this.txModel.create(
        [
          {
            userId: senderId,
            reference: crypto.randomUUID(),
            type: TransactionType.TRANSFER,
            amount: -amount, // Negative for sender
            status: TransactionStatus.SUCCESS,
            recipientWalletNumber: recipientWalletNum,
          },
        ],
        { session },
      );

      // 6. Log Transaction (Recipient View - Optional but good for history)
      await this.txModel.create(
        [
          {
            userId: recipientWallet.userId,
            reference: crypto.randomUUID(),
            type: TransactionType.TRANSFER,
            amount: amount, // Positive for recipient
            status: TransactionStatus.SUCCESS,
            senderWalletNumber: senderWallet.walletNumber,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return { status: 'success', message: 'Transfer completed' };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // --- READ METHODS ---
  async getBalance(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return { balance: wallet.balance };
  }

  async getHistory(userId: string) {
    return this.txModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
  }
}
