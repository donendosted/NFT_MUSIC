import express from 'express';
import MusicNFT from '../models/MusicNFT.js';
import { buildListingTransaction, MARKETPLACE_CONTRACT_ID } from '../services/marketplaceService.js';
import { submitPurchaseTransaction } from '../services/purchaseService.js';

const router = express.Router();
const PAYMENT_ASSET_CONTRACT_ID = process.env.PAYMENT_ASSET_CONTRACT_ID;
const NFT_CONTRACT_ID = process.env.NFT_CONTRACT_ID || process.env.NFT_COLLECTION_ID;

async function findOwnedNft(tokenId, seller) {
  return MusicNFT.findOne({ tokenId: Number(tokenId), contractAddress: NFT_CONTRACT_ID, walletAddress: seller.toLowerCase(), 'listing.active': { $ne: true } });
}

router.post('/build', async (req, res) => {
  try {
    const { seller, tokenId, price } = req.body;
    const nft = await findOwnedNft(tokenId, seller);
    if (!nft) throw new Error('Music NFT is not available to list');
    const transactionXDR = await buildListingTransaction({ seller, tokenId: Number(tokenId), price });
    res.json({ success: true, data: { transactionXDR, contractId: MARKETPLACE_CONTRACT_ID } });
  } catch (err) { res.status(400).json({ success: false, error: { message: err.message } }); }
});

router.post('/', async (req, res) => {
  try {
    const { signedTxXDR, seller, tokenId, price } = req.body;
    if (!signedTxXDR) throw new Error('Missing signedTxXDR');
    const nft = await findOwnedNft(tokenId, seller);
    if (!nft) throw new Error('Music NFT is not available to list');
    const confirmed = await submitPurchaseTransaction(signedTxXDR);
    const listingId = String(confirmed.returnValue);
    if (!/^\d+$/.test(listingId)) throw new Error('Marketplace did not return a listing ID');
    await MusicNFT.updateOne({ _id: nft._id }, { $set: { listing: { listingId, seller, price: String(price), asset: PAYMENT_ASSET_CONTRACT_ID, marketplaceContract: MARKETPLACE_CONTRACT_ID, active: true } } });
    res.json({ success: true, listingId, transactionHash: confirmed.transactionHash, ledger: confirmed.ledger, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${confirmed.transactionHash}` });
  } catch (err) { res.status(400).json({ success: false, error: { message: err.message } }); }
});

export default router;
