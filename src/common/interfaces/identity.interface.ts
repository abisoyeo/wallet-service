export interface Identity {
  type: 'user' | 'service';
  userId?: string;
  email?: string;
  serviceName?: string;
}
