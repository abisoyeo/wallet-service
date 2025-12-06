export class ApiKey {
  id: string;
  keyPrefix: string; // To show the user "sk_live_1234..."
  keyHash: string; // The hashed full key
  serviceName: string;
  isActive: boolean;
  expiresAt: Date;
}
