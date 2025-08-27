import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Database from '../config/database';
import RedisClient from '../config/redis';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { generateReport } from '../services/reportGenerator';
import { exportReport } from '../services/reportExporter';

const router = Router();

// Get report categories - this needs to be before the /:id route
router.get('/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = Database.getInstance();
    const result = await db.query('SELECT * FROM report_categories ORDER BY name');

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Get all reports with filtering and pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      category,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    // Build dynamic WHERE clause
    if (type) {
      whereClause += ` AND r.type = $${++paramCount}`;
      queryParams.push(type);
    }
    
    if (status) {
      whereClause += ` AND r.status = $${++paramCount}`;
      queryParams.push(status);
    }
    
    if (category) {
      whereClause += ` AND r.category_id = $${++paramCount}`;
      queryParams.push(category);
    }
    
    if (search) {
      whereClause += ` AND (r.title ILIKE $${++paramCount} OR r.description ILIKE $${++paramCount})`;
      queryParams.push(`%${search}%`, `%${search}%`);
      paramCount++;
    }

    const db = Database.getInstance();

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      LEFT JOIN report_categories rc ON r.category_id = rc.id
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get reports with pagination
    const reportsQuery = `
      SELECT 
        r.id, r.title, r.description, r.type, r.format, r.status,
        r.file_path, r.file_size, r.created_at, r.updated_at,
        rc.name as category_name, rc.slug as category_slug, rc.icon as category_icon, rc.color as category_color,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM reports r
      LEFT JOIN report_categories rc ON r.category_id = rc.id
      LEFT JOIN users u ON r.created_by = u.id
      ${whereClause}
      ORDER BY r.${sortBy} ${String(sortOrder).toUpperCase()}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    queryParams.push(Number(limit), offset);

    const reportsResult = await db.query(reportsQuery, queryParams);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      success: true,
      data: reportsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// Get single report by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check cache first
    const redis = RedisClient.getInstance();
    const cachedReport = await redis.getCachedReport(id);
    
    if (cachedReport) {
      res.status(200).json({
        success: true,
        data: cachedReport,
        cached: true
      });
      return;
    }

    const db = Database.getInstance();
    const result = await db.query(`
      SELECT 
        r.id, r.title, r.description, r.type, r.format, r.status, r.data, r.metadata,
        r.file_path, r.file_size, r.created_at, r.updated_at,
        rc.name as category_name, rc.slug as category_slug, rc.icon as category_icon,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM reports r
      LEFT JOIN report_categories rc ON r.category_id = rc.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    const report = result.rows[0];

    // Cache the report for 1 hour
    await redis.cacheReport(id, report, 3600);

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// Create new report
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      categoryId,
      type,
      format,
      templateId,
      filters,
      timeRange
    } = req.body;

    if (!title || !type || !format) {
      res.status(400).json({
        success: false,
        error: 'Title, type, and format are required'
      });
      return;
    }

    const reportId = uuidv4();
    const db = Database.getInstance();

    // Generate report data
    const reportData = await generateReport({
      type,
      filters,
      timeRange,
      templateId
    });

    const metadata = {
      generatedAt: new Date().toISOString(),
      timeRange,
      filters,
      totalRecords: reportData.records?.length || 0,
      executionTime: reportData.executionTime,
      version: '1.0.0'
    };

    // Save report to database
    const result = await db.query(`
      INSERT INTO reports (
        id, title, description, category_id, type, format, status, 
        data, metadata, created_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, type, format, status, created_at
    `, [
      reportId, title, description, categoryId, type, format, 'published',
      JSON.stringify(reportData), JSON.stringify(metadata),
      req.user!.id, new Date(), new Date()
    ]);

    // Log report creation
    await db.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user!.id, 'create', 'report', reportId, { title, type, format }]);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report'
    });
  }
});

// Export report in specified format
router.get('/:id/export', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    const db = Database.getInstance();
    const result = await db.query('SELECT * FROM reports WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    const report = result.rows[0];
    const exportFormat = (format as string) || report.format;

    // Export report
    const exportResult = await exportReport(report, exportFormat);

    // Set appropriate headers
    const contentTypeMap: Record<string, string> = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      html: 'text/html',
      json: 'application/json'
    };
    const contentType = contentTypeMap[exportFormat] || 'application/octet-stream';

    const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (exportFormat === 'json') {
      res.status(200).json(exportResult.buffer);
    } else {
      res.status(200).send(exportResult.buffer);
    }

    // Log export
    await db.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user!.id, 'export', 'report', id, { format: exportFormat }]);

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

// Delete report
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const db = Database.getInstance();
    const result = await db.query('DELETE FROM reports WHERE id = $1 RETURNING title', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    // Clear cache
    const redis = RedisClient.getInstance();
    await redis.invalidateReportCache(id);

    // Log deletion
    await db.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user!.id, 'delete', 'report', id, { title: result.rows[0].title }]);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

export default router;