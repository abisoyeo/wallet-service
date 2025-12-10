export interface Identity {
  type: 'user' | 'service';

  userId?: string;
  email?: string;

  // Service properties
  serviceId?: string;
  name?: string;
  ownerId?: string;
  permissions?: string[];
}
