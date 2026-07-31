import express from 'express';
import { buildMintTransaction, submitTransaction } from '../services/mintService.js';
import MusicNFT from '../models/MusicNFT.js';

const router = express.Router();
const DEFAULT_IPFS_GATEWAY = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
const NFT_CONTRACT_ID = process.env.NFT_CONTRACT_ID || process.env.NFT_COLLECTION_ID;

function normalizeIpfsHash(value = '') {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('ipfs://')) {
    const withoutPrefix = trimmed.slice('ipfs://'.length);
    const [hash] = withoutPrefix.split(/[/?#]/);
    return hash || null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const match = trimmed.match(/\/ipfs\/([^/?#]+)/i);
    return match?.[1] || null;
  }

  return trimmed;
}

function hashToTokenUri(ipfsHash) {
  return `ipfs://${ipfsHash}`;
}

function hashToGatewayUrl(ipfsHash) {
  return `${DEFAULT_IPFS_GATEWAY}/${ipfsHash}`;
}

router.post('/build', async (req, res) => {
  try {
    const { walletAddress, name, ipfsHash, musicUrl, artist } = req.body;
    const normalizedHash = normalizeIpfsHash(ipfsHash || musicUrl);

    if (!walletAddress || !normalizedHash) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing walletAddress or valid ipfsHash/musicUrl' },
      });
    }

    const transactionXDR = await buildMintTransaction(
      walletAddress,
      name || 'Music NFT',
      hashToTokenUri(normalizedHash),
      artist || 'Unknown'
    );

    res.json({
      success: true,
      data: { transactionXDR, ipfsHash: normalizedHash },
    });
  } catch (err) {
    console.error('[Mint Build] Error:', err.message);
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { signedTxXDR, walletAddress, name, ipfsHash, musicUrl, artist } = req.body;
    const normalizedHash = normalizeIpfsHash(ipfsHash || musicUrl);

    if (!signedTxXDR || !walletAddress || !normalizedHash) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing signedTxXDR, walletAddress, or valid ipfsHash/musicUrl' },
      });
    }

    const result = await submitTransaction(signedTxXDR);

    const tokenId = Number(result.returnValue);
    if (!Number.isSafeInteger(tokenId) || tokenId <= 0) {
      throw new Error('Music NFT contract did not return a valid token ID');
    }

    const musicNFT = new MusicNFT({
      tokenId,
      name: name || 'Music NFT',
      artist: artist || 'Unknown',
      musicUrl: hashToGatewayUrl(normalizedHash),
      ipfsHash: normalizedHash,
      owner: walletAddress,
      walletAddress: walletAddress.toLowerCase(),
      txHash: result.txHash,
      contractAddress: NFT_CONTRACT_ID,
    });

    await musicNFT.save();

    res.json({
      success: true,
      data: {
        tokenId,
        ipfsHash: normalizedHash,
        musicUrl: hashToGatewayUrl(normalizedHash),
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
      },
    });
  } catch (err) {
    console.error('[Mint Submit] Error:', err.message);
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
});

export default router;
