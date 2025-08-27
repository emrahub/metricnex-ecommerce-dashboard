import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'E-Commerce Dashboard API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      reports: '/api/reports',
      categories: '/api/reports/categories',
      dashboard: '/api/dashboard/metrics'
    },
    documentation: 'Visit the frontend at http://localhost:3001'
  });
});

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'e-commerce-dashboard-api'
  });
});

// Mock auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@example.com' && password === 'password') {
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        },
        expiresIn: 604800
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Real reports endpoint - reads actual files from uploads/reports
app.get('/api/reports', (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '../uploads/reports');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const allFiles = fs.readdirSync(reportsDir).filter(file => {
      const filePath = path.join(reportsDir, file);
      return !fs.statSync(filePath).isDirectory();
    });
    
    // Calculate pagination
    const totalFiles = allFiles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const files = allFiles.slice(startIndex, endIndex);

    const reports = files.map((filename, index) => {
      const filePath = path.join(reportsDir, filename);
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Determine format and type
      let format = 'other';
      let type = 'general';
      let categoryColor = '#6B7280';
      let categoryName = 'General Reports';
      
      if (ext === '.pdf') {
        format = 'pdf';
        categoryName = 'PDF Reports';
        if (filename.toLowerCase().includes('analiz') || filename.toLowerCase().includes('analysis')) {
          type = 'analytics';
          categoryColor = '#3B82F6';
          categoryName = 'Analytics Reports';
        } else if (filename.toLowerCase().includes('test') || filename.toLowerCase().includes('uzmanl')) {
          type = 'assessment';
          categoryColor = '#8B5CF6';
          categoryName = 'Assessment Reports';
        } else {
          type = 'report';
          categoryColor = '#10B981';
        }
      } else if (ext === '.xlsx' || ext === '.xls') {
        format = 'excel';
        type = 'data';
        categoryColor = '#F59E0B';
        categoryName = 'Excel Reports';
      } else if (ext === '.html' || ext === '.mhtml') {
        format = 'html';
        type = 'dashboard';
        categoryColor = '#EF4444';
        categoryName = 'HTML Reports';
      }
      
      // Clean title
      let title = filename.replace(/\.[^/.]+$/, ''); // Remove extension
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      
      return {
        id: (startIndex + index + 1).toString(),
        title,
        description: `Report file: ${filename}`,
        type,
        format,
        status: 'published',
        category: {
          name: categoryName,
          color: categoryColor
        },
        createdAt: stats.mtime.toISOString().split('T')[0],
        createdBy: 'System',
        fileSize: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
        filename,
        downloadUrl: `/api/reports/${startIndex + index + 1}/download`
      };
    });

    res.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total: totalFiles,
        totalPages: Math.ceil(totalFiles / limit)
      }
    });
    
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load reports',
      message: 'Could not read reports directory'
    });
  }
});

// Get single report by ID
app.get('/api/reports/:id', (req, res) => {
  try {
    const reportId = req.params.id;
    const reportsDir = path.join(__dirname, '../uploads/reports');
    
    if (!fs.existsSync(reportsDir)) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    const files = fs.readdirSync(reportsDir).filter(file => {
      const filePath = path.join(reportsDir, file);
      return !fs.statSync(filePath).isDirectory();
    });

    // Find report by index (ID is 1-based)
    const reportIndex = parseInt(reportId) - 1;
    
    if (reportIndex < 0 || reportIndex >= files.length) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const filename = files[reportIndex];
    const filePath = path.join(reportsDir, filename);
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Determine format and type (same logic as reports list)
    let format = 'other';
    let type = 'general';
    let categoryColor = '#6B7280';
    let categoryName = 'General Reports';
    
    if (ext === '.pdf') {
      format = 'pdf';
      categoryName = 'PDF Reports';
      if (filename.toLowerCase().includes('analiz') || filename.toLowerCase().includes('analysis')) {
        type = 'analytics';
        categoryColor = '#3B82F6';
        categoryName = 'Analytics Reports';
      } else if (filename.toLowerCase().includes('test') || filename.toLowerCase().includes('uzmanl')) {
        type = 'assessment';
        categoryColor = '#8B5CF6';
        categoryName = 'Assessment Reports';
      } else {
        type = 'report';
        categoryColor = '#10B981';
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      format = 'excel';
      type = 'data';
      categoryColor = '#F59E0B';
      categoryName = 'Excel Reports';
    } else if (ext === '.html' || ext === '.mhtml') {
      format = 'html';
      type = 'dashboard';
      categoryColor = '#EF4444';
      categoryName = 'HTML Reports';
    }
    
    // Clean title
    let title = filename.replace(/\.[^/.]+$/, '');
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
    
    const report = {
      id: reportId,
      title,
      description: `Report file: ${filename}`,
      type,
      format,
      status: 'published',
      category: {
        name: categoryName,
        color: categoryColor
      },
      createdAt: stats.mtime.toISOString().split('T')[0],
      createdBy: 'System',
      fileSize: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
      filename,
      downloadUrl: `/api/reports/${reportId}/download`
    };

    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load report'
    });
  }
});

// Mock report categories
app.get('/api/reports/categories', (req, res) => {
  const mockCategories = [
    { id: '1', name: 'Sales Reports', slug: 'sales', color: '#10B981', icon: 'chart-line' },
    { id: '2', name: 'Inventory Reports', slug: 'inventory', color: '#F59E0B', icon: 'cube' },
    { id: '3', name: 'Customer Analytics', slug: 'customer', color: '#3B82F6', icon: 'user-group' },
    { id: '4', name: 'Financial Reports', slug: 'financial', color: '#8B5CF6', icon: 'currency-dollar' }
  ];

  res.json({
    success: true,
    data: mockCategories
  });
});

// Dashboard metrics - real counts from reports directory
app.get('/api/dashboard/metrics', (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '../uploads/reports');
    let totalReports = 0;
    let reportsThisMonth = 0;
    
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir).filter(file => {
        const filePath = path.join(reportsDir, file);
        return !fs.statSync(filePath).isDirectory();
      });
      
      totalReports = files.length;
      
      // Count reports from this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      reportsThisMonth = files.filter(filename => {
        const filePath = path.join(reportsDir, filename);
        const stats = fs.statSync(filePath);
        const fileMonth = stats.mtime.getMonth();
        const fileYear = stats.mtime.getFullYear();
        return fileMonth === currentMonth && fileYear === currentYear;
      }).length;
    }

    res.json({
      success: true,
      data: {
        totalReports,
        reportsThisMonth,
        activeScheduledReports: 3,
        totalDataSources: 4,
        systemHealth: {
          database: 'healthy',
          redis: 'healthy',
          storage: totalReports > 0 ? 'healthy' : 'empty'
        }
      }
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard metrics'
    });
  }
});

// Create report endpoint
app.post('/api/reports', (req, res) => {
  const { title, description, type, format } = req.body;
  
  if (!title || !type || !format) {
    return res.status(400).json({
      success: false,
      error: 'Title, type, and format are required'
    });
  }

  const newReport = {
    id: 'new_' + Date.now(),
    title,
    description,
    type,
    format,
    status: 'published',
    createdAt: new Date().toISOString(),
    createdBy: 'Current User'
  };

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: newReport
  });
});

// Download report endpoint
app.get('/api/reports/:id/download', (req, res) => {
  try {
    const reportId = req.params.id;
    const reportsDir = path.join(__dirname, '../uploads/reports');
    
    if (!fs.existsSync(reportsDir)) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    const files = fs.readdirSync(reportsDir).filter(file => {
      const filePath = path.join(reportsDir, file);
      return !fs.statSync(filePath).isDirectory();
    });

    // Find report by index (ID is 1-based)
    const reportIndex = parseInt(reportId) - 1;
    
    if (reportIndex < 0 || reportIndex >= files.length) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const filename = files[reportIndex];
    const filePath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Set appropriate headers for different file types
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report'
    });
  }
});

// Analytics API routes
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`👤 Demo login: admin@example.com / password`);
});