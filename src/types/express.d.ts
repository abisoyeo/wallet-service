import { Identity } from '../common/interfaces/identity.interface';

declare global {
  namespace Express {
    interface Request {
      user?: Identity;
    }
  }
}
