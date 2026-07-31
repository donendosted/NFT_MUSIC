import 'dotenv/config';
import mongoose from 'mongoose';
import MusicNFT from '../models/MusicNFT.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

await mongoose.connect(process.env.MONGODB_URI);
try {
  await MusicNFT.collection.dropIndex('tokenId_1');
  console.log('Dropped legacy unique tokenId index');
} catch (error) {
  if (error.codeName !== 'IndexNotFound') throw error;
  console.log('Legacy tokenId index was already absent');
}
await MusicNFT.collection.createIndex({ contractAddress: 1, tokenId: 1 }, { unique: true, name: 'contractAddress_1_tokenId_1' });
console.log('Created compound unique contractAddress/tokenId index');
await mongoose.disconnect();
