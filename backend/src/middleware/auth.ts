import { Request, Response, NextFunction } from 'express';
import admin from '../firebase';

export interface RequestWithUser extends Request {
  user: {
    uid: string;
    name?: string;
    email?: string;
    picture?: string;
    email_verified?: boolean;
    [key: string]: string | boolean | undefined;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No Authorization header or malformed header');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as RequestWithUser).user = decodedToken;
    console.log('Decoded Token:', decodedToken);
    next();
  } catch (error: unknown) {
    console.error('Error verifying ID token:', error);
    if (error instanceof Error) {
      res.status(401).json({ message: 'Unauthorized' });
    } else {
      res.status(401).json({ message: 'An unexpected error occurred.' });
    }
  }
};
