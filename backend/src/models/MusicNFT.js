import mongoose from 'mongoose';

const musicNFTSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  artist: { type: String, default: 'Unknown' },
  musicUrl: { type: String, required: true },
  ipfsHash: { type: String },
  owner: { type: String, required: true },
  walletAddress: { type: String, required: true },
  txHash: { type: String },
  contractAddress: { type: String, required: true },
  listing: {
    listingId: { type: String },
    seller: { type: String },
    price: { type: String },
    asset: { type: String },
    marketplaceContract: { type: String },
    active: { type: Boolean, default: false },
    soldAt: { type: Date },
    purchaseId: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

musicNFTSchema.index({ walletAddress: 1 });
musicNFTSchema.index({ owner: 1 });
musicNFTSchema.index({ 'listing.listingId': 1, 'listing.active': 1 });

export default mongoose.models.MusicNFT || mongoose.model('MusicNFT', musicNFTSchema);
