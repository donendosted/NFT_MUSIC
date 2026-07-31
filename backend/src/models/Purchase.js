import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  purchaseId: { type: String, required: true, unique: true },
  listingId: { type: String, required: true, index: true },
  nftContract: { type: String, required: true },
  marketplaceContract: { type: String, required: true },
  purchaseContract: { type: String, required: true },
  tokenId: { type: Number, required: true },
  buyer: { type: String, required: true, index: true },
  seller: { type: String, required: true, index: true },
  amount: { type: String, required: true },
  asset: { type: String, required: true },
  ledger: { type: Number },
  transactionHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  timestamp: { type: Date, default: Date.now },
});

purchaseSchema.index({ listingId: 1, status: 1 });

export default mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);
