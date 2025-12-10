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
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { CurrentIdentity } from 'src/common/decorators/current-identity.decorator';
import type { Identity } from 'src/common/interfaces/identity.interface';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { User } from 'src/users/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private getWalletOwner(identity: Identity): string {
    if (identity.type === 'user') {
      return identity.userId!;
    }
    if (identity.type === 'service' && identity.ownerId) {
      return identity.ownerId;
    }
    throw new BadRequestException('Cannot determine wallet owner');
  }

  private async getServiceOwnerEmail(ownerId: string): Promise<string> {
    const user = await this.userModel.findById(ownerId).select('email');

    if (!user || !user.email) {
      throw new NotFoundException('Service owner not found or has no email');
    }

    return user.email;
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['deposit'])
  @Post('deposit')
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiBody({ type: DepositDto })
  @ApiOperation({ summary: 'Initiate a deposit into the wallet' })
  @ApiResponse({ status: 201, description: 'Deposit initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deposit(
    @CurrentIdentity() identity: Identity,
    @Body() body: DepositDto,
  ) {
    const userId = this.getWalletOwner(identity);

    let email: string;

    if (identity.type === 'user') {
      if (!identity.email) {
        throw new BadRequestException('User email is required');
      }
      email = identity.email;
    } else if (identity.type === 'service') {
      if (!identity.ownerId) {
        throw new BadRequestException('Service owner ID is required');
      }
      email = await this.getServiceOwnerEmail(identity.ownerId);
    } else {
      throw new BadRequestException('Invalid identity type');
    }

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
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Check the status of a deposit' })
  @ApiResponse({ status: 200, description: 'Deposit status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkStatus(@Param('reference') ref: string) {
    return this.walletService.getDepositStatus(ref);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['read'])
  @Get('balance')
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get the wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getBalance(userId);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['read'])
  @Get()
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get the wallet details & balance' })
  @ApiResponse({ status: 200, description: 'Wallet details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWalletDetails(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getWalletByUserId(userId);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']), PermissionsGuard)
  @SetMetadata('permissions', ['transfer'])
  @Post('transfer')
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
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
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get the transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@CurrentIdentity() identity: Identity) {
    const userId = this.getWalletOwner(identity);
    return this.walletService.getHistory(userId);
  }
}
