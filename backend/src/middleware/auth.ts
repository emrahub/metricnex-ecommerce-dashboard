import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Database from '../config/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Verify user still exists and is active
    const db = Database.getInstance();
    const result = await db.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
      return;
    }

    const user = result.rows[0];
    if (!user.is_active) {
      res.status(401).json({ 
        success: false, 
        error: 'Account is inactive' 
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireManagerOrAdmin = requireRole(['manager', 'admin']);

export { AuthenticatedRequest };