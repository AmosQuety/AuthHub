import { JwtPayload } from "jsonwebtoken"; // Or jose payload type if preferred, but usually explicit interface is better

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        [key: string]: any;
      };
    }
  }
}

export {};
