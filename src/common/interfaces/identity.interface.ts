export interface Identity {
  type: 'user' | 'service';
  userId?: string;
  email?: string;

  serviceId?: string;
  name?: string;
}
