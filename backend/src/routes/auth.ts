import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Database from '../config/database';
import RedisClient from '../config/redis';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
      return;
    }

    const db = Database.getInstance();
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user and organization in transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role`,
        [uuidv4(), email.toLowerCase(), hashedPassword, firstName, lastName, 'admin']
      );

      const user = userResult.rows[0];

      // Create organization if provided
      if (organizationName) {
        const orgResult = await client.query(
          `INSERT INTO organizations (id, name) VALUES ($1, $2) RETURNING id`,
          [uuidv4(), organizationName]
        );

        // Link user to organization
        await client.query(
          `INSERT INTO user_organizations (user_id, organization_id, role) VALUES ($1, $2, $3)`,
          [user.id, orgResult.rows[0].id, 'admin']
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Demo/dev mode: allow mock login without DB
    if (process.env.DEMO_MODE === 'true' || process.env.DISABLE_AUTH === 'true') {
      if (email === 'admin@example.com' && password === 'password') {
        const token = 'mock-jwt-token';
        res.status(200).json({
          success: true,
          data: {
            token,
            user: {
              id: 'demo-user',
              email: 'admin@example.com',
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin'
            },
            // 7 days in seconds
            expiresIn: 7 * 24 * 60 * 60
          }
        });
        return;
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }
    }

    const db = Database.getInstance();
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
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

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    // Use provided JWT secret or a development fallback to prevent crashes
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Store session in Redis
    const redis = RedisClient.getInstance();
    const sessionId = uuidv4();
    await redis.setSession(sessionId, user.id);

    // Log successful login
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'login', 'auth', req.ip, req.headers['user-agent']]
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (token) {
      // In a production app, you might want to blacklist the token
      // For now, we'll just clear any associated session
      const redis = RedisClient.getInstance();
      // Note: This is a simplified logout - in production you'd need to track session IDs
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = Database.getInstance();
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at,
              o.id as org_id, o.name as org_name
       FROM users u
       LEFT JOIN user_organizations uo ON u.id = uo.user_id
       LEFT JOIN organizations o ON uo.organization_id = o.id
       WHERE u.id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        organization: user.org_id ? {
          id: user.org_id,
          name: user.org_name
        } : null
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

export default router;
