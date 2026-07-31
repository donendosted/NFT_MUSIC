import express from 'express';
import MusicNFT from '../models/MusicNFT.js';
import Purchase from '../models/Purchase.js';
import { buildPurchaseTransaction, purchaseExplorerUrl, PURCHASE_CONTRACT_ID, submitPurchaseTransaction } from '../services/purchaseService.js';
import { MARKETPLACE_CONTRACT_ID, MUSIC_NFT_V2_CONTRACT_ID, PAYMENT_ASSET_CONTRACT_ID } from '../config/contracts.js';

const router = express.Router();

async function findActiveListing(listingId) {
  return MusicNFT.findOne({ 'listing.listingId': String(listingId), 'listing.active': true });
}

function validateListing(nft, buyer, offeredPrice) {
  if (!nft) throw new Error('Listing not found or no longer active');
  if (!nft.listing) throw new Error('Music NFT has no listing metadata');
  if (nft.listing.seller.toLowerCase() === buyer.toLowerCase()) throw new Error('Seller cannot buy their own listing');
  if (String(nft.listing.price) !== String(offeredPrice)) throw new Error('Offered price does not match listing price');
  if (nft.owner.toLowerCase() !== nft.listing.seller.toLowerCase()) throw new Error('Listing seller no longer owns this Music NFT');
}

router.post('/build', async (req, res) => {
  try {
    const { listingId, buyer, offeredPrice } = req.body;
    const nft = await findActiveListing(listingId);
    validateListing(nft, buyer, offeredPrice);
    const transactionXDR = await buildPurchaseTransaction({ buyer, listingId, offeredPrice });
    res.json({ success: true, data: { transactionXDR, contractId: PURCHASE_CONTRACT_ID, listingId: String(listingId) } });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// This is the purchase endpoint: it submits an already Freighter-signed XDR,
// polls Soroban RPC, then records only the confirmed transaction hash.
router.post('/', async (req, res) => {
  try {
    const { signedTxXDR, listingId, buyer, offeredPrice } = req.body;
    if (!signedTxXDR) throw new Error('Missing signedTxXDR');
    const nft = await findActiveListing(listingId);
    validateListing(nft, buyer, offeredPrice);

    const confirmed = await submitPurchaseTransaction(signedTxXDR);
    const seller = nft.listing.seller;
    const onChainPurchaseId = confirmed.returnValue?.purchase_id ?? confirmed.returnValue?.purchaseId;
    // The value comes from the confirmed contract return. Keep a hash-scoped
    // fallback only for older RPC responses that omit a return value.
    const purchaseId = onChainPurchaseId
      ? `${PURCHASE_CONTRACT_ID}:${onChainPurchaseId}`
      : `${PURCHASE_CONTRACT_ID}:${listingId}:${confirmed.transactionHash}`;
    const purchase = await Purchase.create({
      purchaseId,
      listingId: String(listingId),
      nftContract: MUSIC_NFT_V2_CONTRACT_ID,
      marketplaceContract: MARKETPLACE_CONTRACT_ID,
      purchaseContract: PURCHASE_CONTRACT_ID,
      tokenId: nft.tokenId,
      buyer,
      seller,
      amount: String(offeredPrice),
      asset: PAYMENT_ASSET_CONTRACT_ID,
      ledger: confirmed.ledger,
      transactionHash: confirmed.transactionHash,
      status: confirmed.status,
    });

    await MusicNFT.updateOne(
      { _id: nft._id, 'listing.active': true },
      { $set: { owner: buyer, walletAddress: buyer.toLowerCase(), 'listing.active': false, 'listing.soldAt': new Date(), 'listing.purchaseId': purchaseId } }
    );

    res.json({
      success: true,
      transactionHash: confirmed.transactionHash,
      ledger: confirmed.ledger,
      status: confirmed.status,
      buyer,
      seller,
      listingId: String(listingId),
      contractId: PURCHASE_CONTRACT_ID,
      explorerUrl: purchaseExplorerUrl(confirmed.transactionHash),
      purchase,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.get('/history/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const purchases = await Purchase.find({ $or: [{ buyer: new RegExp(`^${address}$`, 'i') }, { seller: new RegExp(`^${address}$`, 'i') }] }).sort({ timestamp: -1 });
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
