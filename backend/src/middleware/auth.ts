import { Request, Response, NextFunction } from 'express';
import admin from '../firebase';

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
      (req as any).user = decodedToken;
      console.log('Decoded Token:', decodedToken);
      next();
    } catch (error) {
      console.error('Error verifying ID token:', error);
      res.status(401).json({ message: 'Unauthorized' });
    }
  };