declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: { id: number; username: string; is_admin: boolean; created_at: number };
      sessionToken?: string;
      cookies?: Record<string, string>;
    }
  }
}

export {};
