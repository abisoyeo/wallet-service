// src/wallet/paystack.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  constructor(private configService: ConfigService) {}

  async initializeTransaction(email: string, amount: number) {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email, amount: amount * 100 }, // Paystack expects Kobo
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      return response.data.data;
    } catch (error) {
      throw new InternalServerErrorException('Paystack initialization failed');
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
