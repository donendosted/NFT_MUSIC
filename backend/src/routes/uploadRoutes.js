import express from 'express';
import multer from 'multer';
import { uploadToPinata } from '../services/pinataService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'No file provided' } 
      });
    }

    const result = await uploadToPinata(
      req.file.buffer,
      req.file.originalname,
      {
        walletAddress: req.body.walletAddress || 'anonymous',
        name: req.body.name || req.file.originalname,
        artist: req.body.artist || 'Unknown',
        uploadedAt: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      data: {
        ipfsHash: result.ipfsHash,
        url: result.url,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: { message: err.message } 
    });
  }
});

export default router;