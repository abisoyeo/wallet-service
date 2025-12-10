import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
  SetMetadata,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { CurrentIdentity } from 'src/common/decorators/current-identity.decorator';
import type { Identity } from 'src/common/interfaces/identity.interface';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  // --- Helper to get the Target User ID (Wallet Owner) ---
  private getWalletOwner(identity: Identity): string {
    if (identity.type === 'user') {
      return identity.userId!;
    }
    if (identity.type === 'service' && identity.ownerId) {
      return identity.ownerId;
    }
    throw new BadRequestException('Cannot determine wallet owner');
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['deposit'])
  @Post('deposit')
  async deposit(
    @CurrentIdentity() identity: Identity,
    @Body() body: { amount: number },
  ) {
    const userId = this.getWalletOwner(identity);

    // Fallback email logic: Users have emails, Services might need the Owner's email
    // You might want to fetch the user from DB here if email is strictly required for Paystack
    const email = identity.email || 'service-integration@example.com';

    return this.walletService.initiateDeposit(userId, email, body.amount);
  }

  @Post('paystack/webhook')
  async webhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    return this.walletService.handleWebhook(signature, body);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Get('deposit/:reference/status')
  async checkStatus(@Param('reference') ref: string) {
    // Just find the transaction
    // Implementation left brief:
    // return this.txModel.findOne({ reference: ref });
    return { message: 'Implement read-only logic here' };
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['read'])
  @Get('balance')
  async getBalance(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getBalance(userId);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['transfer'])
  @Post('transfer')
  async transfer(
    @CurrentIdentity() identity: Identity,
    @Body() body: { wallet_number: string; amount: number },
  ) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.transferFunds(
      userId,
      body.wallet_number,
      body.amount,
    );
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['read'])
  @Get('transactions')
  async getHistory(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getHistory(userId);
  }
}
