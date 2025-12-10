import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  constructor(private configService: ConfigService) {}

  async initializeTransaction(email: string, amount: number) {
    const secretKey = this.configService.getOrThrow<string>(
      'PAYSTACK_SECRET_KEY',
    );

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email, amount },
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      return response.data.data;
    } catch (error) {
      throw new InternalServerErrorException('Paystack initialization failed');
    }
  }

  async verifyTransaction(reference: string) {
    const secretKey = this.configService.getOrThrow<string>(
      'PAYSTACK_SECRET_KEY',
    );

    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          message: 'Paystack verification failed',
          error: msg,
        },
        status,
      );
    }
  }

  verifySignature(signature: string, body: any): boolean {
    const secret = this.configService.get('PAYSTACK_SECRET_KEY');
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return hash === signature;
  }
}
