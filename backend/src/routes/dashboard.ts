import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Database from '../config/database';
import RedisClient from '../config/redis';
import { StorageConfig } from '../config/storage';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/metrics
router.get('/metrics', authenticateToken, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  let totalReports = 0;
  let reportsThisMonth = 0;
  let activeScheduledReports = 0;
  let totalDataSources = 0;

  let dbHealth: 'healthy' | 'warning' | 'error' = 'healthy';
  let redisHealth: 'healthy' | 'warning' | 'error' = 'healthy';
  let storageHealth: 'healthy' | 'warning' | 'error' = 'healthy';

  // Prefer database metrics if available; fallback to filesystem counts
  try {
    const db = Database.getInstance();

    const totalReportsRes = await db.query('SELECT COUNT(*)::int AS count FROM reports');
    totalReports = totalReportsRes.rows[0]?.count ?? 0;

    const reportsThisMonthRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM reports WHERE date_trunc('month', created_at) = date_trunc('month', NOW())"
    );
    reportsThisMonth = reportsThisMonthRes.rows[0]?.count ?? 0;

    const activeScheduledRes = await db.query(
      'SELECT COUNT(*)::int AS count FROM scheduled_reports WHERE is_active = true'
    );
    activeScheduledReports = activeScheduledRes.rows[0]?.count ?? 0;

    const dataSourcesRes = await db.query(
      'SELECT COUNT(*)::int AS count FROM data_sources'
    );
    totalDataSources = dataSourcesRes.rows[0]?.count ?? 0;

    dbHealth = 'healthy';
  } catch (e) {
    // Database unavailable: mark health and fallback to filesystem-derived metrics
    dbHealth = 'error';
    try {
      const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
      if (fs.existsSync(reportsDir)) {
        const files = fs
          .readdirSync(reportsDir)
          .filter((file) => !fs.statSync(path.join(reportsDir, file)).isDirectory());

        totalReports = files.length;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        reportsThisMonth = files.filter((filename) => {
          const stats = fs.statSync(path.join(reportsDir, filename));
          const d = stats.mtime;
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
      }
    } catch {
      // Keep defaults if filesystem also fails
    }
  }

  // Check Redis health (non-fatal)
  try {
    const redis = RedisClient.getInstance().getClient();
    // ioredis exposes a status string; consider 'ready' as healthy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status: any = (redis as any).status;
    redisHealth = status === 'ready' ? 'healthy' : 'warning';
  } catch {
    redisHealth = 'error';
  }

  // Check storage health by ensuring upload dirs exist and are writable
  try {
    StorageConfig.initializeDirectories();
    const testFile = path.join(StorageConfig.TEMP_DIR, `.health_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    storageHealth = 'healthy';
  } catch {
    storageHealth = 'error';
  }

  res.status(200).json({
    success: true,
    data: {
      totalReports,
      reportsThisMonth,
      activeScheduledReports,
      totalDataSources,
      systemHealth: {
        database: dbHealth,
        redis: redisHealth,
        storage: storageHealth,
      },
    },
  });
});

export default router;

