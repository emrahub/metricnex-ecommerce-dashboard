import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ecommerce_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool(config);
    
    this.pool.on('connect', () => {
      console.log('🐘 Connected to PostgreSQL database');
    });

    this.pool.on('error', (err: Error) => {
      console.error('💥 Unexpected error on idle client', err);
      // In demo mode, do not crash the process. Allow route-level fallbacks.
      if (process.env.DEMO_MODE === 'true') {
        console.warn('⚠️ DEMO_MODE active: ignoring DB idle error (no exit)');
        return;
      }
      process.exit(-1);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Executed query', { text, duration, rows: res.rowCount });
      }
      
      return res;
    } catch (error) {
      console.error('💥 Database query error:', error);
      throw error;
    }
  }

  public async getClient() {
    return await this.pool.connect();
  }

  public async close() {
    await this.pool.end();
    console.log('🐘 Database connection closed');
  }
}

export default Database;
