import { Router, Request, Response } from 'express';
import googleAdsService from '../services/googleAds';

const router = Router();

router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing required parameter: customerId' });
    }

    const campaigns = await googleAdsService.getCampaigns(customerId);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns from Google Ads' });
  }
});

export default router;