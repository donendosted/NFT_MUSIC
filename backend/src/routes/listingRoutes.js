import express from 'express';
import MusicNFT from '../models/MusicNFT.js';
import { buildListingTransaction, MARKETPLACE_CONTRACT_ID } from '../services/marketplaceService.js';
import { submitPurchaseTransaction } from '../services/purchaseService.js';

const router = express.Router();
const PAYMENT_ASSET_CONTRACT_ID = process.env.PAYMENT_ASSET_CONTRACT_ID;
// This must match the NFT address used when the on-chain escrow marketplace
// was initialized. The legacy NFT deployment has no transfer method and cannot
// be listed through the atomic marketplace.
const MARKETPLACE_NFT_CONTRACT_ID = process.env.MARKETPLACE_NFT_CONTRACT_ID || 'CAUBEZ6RC7PWP47FZVBKHPVQ6BRS57FPVPZELZFMVINFNZKOEY6L3MXD';

async function findOwnedNft(tokenId, seller, contractAddress) {
  if (contractAddress !== MARKETPLACE_NFT_CONTRACT_ID) {
    throw new Error('This NFT belongs to the legacy contract and cannot be listed. Mint a new transferable v2 NFT before listing.');
  }
  const nft = await MusicNFT.findOne({ tokenId: Number(tokenId), contractAddress, walletAddress: seller.toLowerCase(), 'listing.active': { $ne: true } });
  return nft;
}

router.post('/build', async (req, res) => {
  try {
    const { seller, tokenId, price, contractAddress } = req.body;
    const nft = await findOwnedNft(tokenId, seller, contractAddress);
    if (!nft) throw new Error('Music NFT is not available to list');
    const transactionXDR = await buildListingTransaction({ seller, tokenId: Number(tokenId), price });
    res.json({ success: true, data: { transactionXDR, contractId: MARKETPLACE_CONTRACT_ID } });
  } catch (err) { res.status(400).json({ success: false, error: { message: err.message } }); }
});

router.post('/', async (req, res) => {
  try {
    const { signedTxXDR, seller, tokenId, price, contractAddress } = req.body;
    if (!signedTxXDR) throw new Error('Missing signedTxXDR');
    const nft = await findOwnedNft(tokenId, seller, contractAddress);
    if (!nft) throw new Error('Music NFT is not available to list');
    const confirmed = await submitPurchaseTransaction(signedTxXDR);
    const listingId = String(confirmed.returnValue);
    if (!/^\d+$/.test(listingId)) throw new Error('Marketplace did not return a listing ID');
    await MusicNFT.updateOne({ _id: nft._id }, { $set: { listing: { listingId, seller, price: String(price), asset: PAYMENT_ASSET_CONTRACT_ID, marketplaceContract: MARKETPLACE_CONTRACT_ID, active: true } } });
    res.json({ success: true, listingId, transactionHash: confirmed.transactionHash, ledger: confirmed.ledger, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${confirmed.transactionHash}` });
  } catch (err) { res.status(400).json({ success: false, error: { message: err.message } }); }
});

export default router;
