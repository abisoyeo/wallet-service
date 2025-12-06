export class User {
  id: number;
  email: string;
  password: string; // In production, this must be hashed (bcrypt)
}
