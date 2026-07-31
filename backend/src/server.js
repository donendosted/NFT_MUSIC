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

// Never let Mongoose queue writes while MongoDB is unavailable. Queued writes
// cause opaque buffering timeouts after an otherwise successful mint.
mongoose.set('bufferCommands', false);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    error: { message: 'Database unavailable. Configure MONGODB_URI and verify MongoDB network access, then retry.' },
  });
};

app.use('/api/upload', uploadRoutes);
app.use('/api/music', requireDatabase, musicRoutes);
app.use('/api/mint', requireDatabase, mintRoutes);
app.use('/api/purchase', requireDatabase, purchaseRoutes);
app.use('/api/listing', requireDatabase, listingRoutes);

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ 
    success: false, 
    error: { message: err.message || 'Internal server error' } 
  });
});

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('[MongoDB] MONGODB_URI is not configured');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    console.log('[MongoDB] Connected');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    setTimeout(connectDatabase, 10_000).unref();
  }
};

const startServer = async () => {
  await connectDatabase();

  console.log(`[Config] Contract ID: ${process.env.NFT_CONTRACT_ID || 'NOT SET'}`);
  console.log(`[Config] Purchase Contract ID: ${process.env.MUSIC_PURCHASE_CONTRACT_ID || 'NOT SET'}`);

  app.listen(PORT, () => {
    console.log(`[Server] NFT Music Backend running on port ${PORT}`);
  });
};

startServer();
