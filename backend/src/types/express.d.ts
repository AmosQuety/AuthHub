declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        sessionId?: string;
        roles?: string[];
        [key: string]: any;
      };
    }
  }
}

export { };
