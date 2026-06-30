import express, { type Request, type Response } from 'express';
import { getQCData } from '../services/qcService.js';

const router = express.Router();

router.get('/qc', async (req: Request, res: Response) => {
  try {
    const { yearMonth } = req.query;
    const data = await getQCData(yearMonth as string);
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch QC data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch QC data',
    });
  }
});

export default router;