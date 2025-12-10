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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { CurrentIdentity } from 'src/common/decorators/current-identity.decorator';
import type { Identity } from 'src/common/interfaces/identity.interface';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('wallet')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a deposit into the wallet' })
  @ApiResponse({ status: 201, description: 'Deposit initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deposit(
    @CurrentIdentity() identity: Identity,
    @Body() body: DepositDto,
  ) {
    const userId = this.getWalletOwner(identity);

    // Fallback email logic: Users have emails, Services might need the Owner's email
    // You might want to fetch the user from DB here if email is strictly required for Paystack
    const email = identity.email || 'service-integration@example.com';

    return this.walletService.initiateDeposit(userId, email, body.amount);
  }

  @Post('paystack/webhook')
  @ApiOperation({ summary: 'Paystack webhook for handling deposit callbacks' })
  @ApiResponse({ status: 200, description: 'Webhook handled successfully' })
  async webhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    return this.walletService.handleWebhook(signature, body);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Get('deposit/:reference/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check the status of a deposit' })
  @ApiResponse({ status: 200, description: 'Deposit status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkStatus(@Param('reference') ref: string) {
    // Just find the transaction
    // Implementation left brief:
    // return this.txModel.findOne({ reference: ref });
    return { message: 'Implement read-only logic here' };
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['read'])
  @Get('balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getBalance(userId);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['transfer'])
  @Post('transfer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @ApiResponse({ status: 201, description: 'Transfer successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async transfer(
    @CurrentIdentity() identity: Identity,
    @Body() body: TransferDto,
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getHistory(userId);
  }
}
