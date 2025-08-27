import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { StorageConfig } from './config/storage';

dotenv.config();

// Initialize storage directories
StorageConfig.initializeDirectories();

const app = express();
export default app;
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (reports, uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'e-commerce-dashboard-api'
  });
});

// Routes
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import analyticsRoutes from './routes/analytics';
import googleAdsRoutes from './routes/googleAds';
import dataSourcesRoutes from './routes/dataSources';
import dashboardRoutes from './routes/dashboard';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/google-ads', googleAdsRoutes);
app.use('/api/data-sources', dataSourcesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api', (req, res) => {
  res.status(200).json({
    message: 'E-Commerce Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      reports: '/api/reports',
      users: '/api/users'
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  });
}
