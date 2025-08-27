import { Router, Request, Response } from 'express';
import googleAnalyticsService from '../services/googleAnalytics';

const router = Router();

router.post('/report', async (req: Request, res: Response) => {
  try {
    const { propertyId, startDate, endDate, metrics, dimensions } = req.body;

    if (!propertyId || !startDate || !endDate || !metrics || !dimensions) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const report = await googleAnalyticsService.getReport(propertyId, startDate, endDate, metrics, dimensions);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report from Google Analytics' });
  }
});

export default router;