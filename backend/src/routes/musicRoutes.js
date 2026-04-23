import express from 'express';
import MusicNFT from '../models/MusicNFT.js';

const router = express.Router();

router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const music = await MusicNFT.find({ 
      walletAddress: walletAddress.toLowerCase() 
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: music });
  } catch (err) {
    console.error('[Music] Fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Failed to fetch music' } 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const music = await MusicNFT.find()
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await MusicNFT.countDocuments();

    res.json({ 
      success: true, 
      data: music,
      pagination: { total, limit: Number(limit), offset: Number(offset) }
    });
  } catch (err) {
    console.error('[Music] List error:', err);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Failed to fetch music' } 
    });
  }
});

export default router;