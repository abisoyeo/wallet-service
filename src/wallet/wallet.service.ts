// src/wallet/wallet.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
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

  async ensureWallet(userId: string, session?: ClientSession) {
    let wallet = await this.walletModel
      .findOne({ userId })
      .session(session || null);

    if (!wallet) {
      const [createdWallet] = await this.walletModel.create(
        [
          {
            userId,
            walletNumber: crypto.randomInt(1000000000, 9999999999).toString(),
            balance: 0,
          },
        ],
        { session: session || undefined },
      );

      wallet = createdWallet;
    }

    return wallet;
  }

  async initiateDeposit(userId: string, email: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    const paystackData = await this.paystackService.initializeTransaction(
      email,
      amount,
    );

    await this.txModel.create({
      userId,
      reference: paystackData.reference,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
    });

    return paystackData;
  }

  async handleWebhook(signature: string, event: any) {
    if (!this.paystackService.verifySignature(signature, event)) {
      throw new ForbiddenException('Invalid signature');
    }

    if (event.event !== 'charge.success') return { status: true };

    const { reference, amount } = event.data;
    const realAmount = amount;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const tx = await this.txModel.findOne({ reference }).session(session);

      if (!tx) {
        await session.abortTransaction();
        return { status: true };
      }

      await this.ensureWallet(tx.userId.toString(), session);

      if (tx.status === TransactionStatus.SUCCESS) {
        await session.abortTransaction();
        return { status: true };
      }

      tx.status = TransactionStatus.SUCCESS;
      await tx.save({ session });

      const updateResult = await this.walletModel
        .updateOne({ userId: tx.userId }, { $inc: { balance: realAmount } })
        .session(session);

      if (updateResult.modifiedCount === 0) {
        throw new Error('Wallet update failed despite ensureWallet');
      }

      await session.commitTransaction();
      return { status: true };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getDepositStatus(reference: string) {
    const localTx = await this.txModel.findOne({ reference });

    const paystackResponse =
      await this.paystackService.verifyTransaction(reference);
    const data = paystackResponse.data;

    return {
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      paid_at: data.paid_at,
      channel: data.channel,
      local_status: localTx ? localTx.status : 'not_found_locally',
    };
  }

  async transferFunds(
    senderId: string,
    recipientWalletNum: string,
    amount: number,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const senderWallet = await this.walletModel
        .findOne({ userId: senderId })
        .session(session);
      if (!senderWallet || senderWallet.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      const recipientWallet = await this.walletModel
        .findOne({ walletNumber: recipientWalletNum })
        .session(session);
      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      senderWallet.balance -= amount;
      await senderWallet.save({ session });

      recipientWallet.balance += amount;
      await recipientWallet.save({ session });

      await this.txModel.create(
        [
          {
            userId: senderId,
            reference: crypto.randomUUID(),
            type: TransactionType.TRANSFER,
            amount: -amount,
            status: TransactionStatus.SUCCESS,
            recipientWalletNumber: recipientWalletNum,
          },
        ],
        { session },
      );

      await this.txModel.create(
        [
          {
            userId: recipientWallet.userId,
            reference: crypto.randomUUID(),
            type: TransactionType.TRANSFER,
            amount: amount,
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

  async getBalance(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return { balance: wallet.balance };
  }

  async getHistory(userId: string) {
    return this.txModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
  }
}
