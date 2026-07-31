import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import uploadRoutes from './routes/uploadRoutes.js';
import musicRoutes from './routes/musicRoutes.js';
import mintRoutes from './routes/mintRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import listingRoutes from './routes/listingRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/mint', mintRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/listing', listingRoutes);

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ 
    success: false, 
    error: { message: err.message || 'Internal server error' } 
  });
});

const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[MongoDB] Connected');
    } else {
      console.log('[MongoDB] MONGODB_URI not set, skipping connection');
    }
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
  }

  console.log(`[Config] Contract ID: ${process.env.NFT_CONTRACT_ID || 'NOT SET'}`);
  console.log(`[Config] Purchase Contract ID: ${process.env.MUSIC_PURCHASE_CONTRACT_ID || 'NOT SET'}`);

  app.listen(PORT, () => {
    console.log(`[Server] NFT Music Backend running on port ${PORT}`);
  });
};

startServer();
