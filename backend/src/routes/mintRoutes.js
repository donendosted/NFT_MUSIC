import express from 'express';
import { buildMintTransaction, submitTransaction } from '../services/mintService.js';
import MusicNFT from '../models/MusicNFT.js';

const router = express.Router();

router.post('/build', async (req, res) => {
  try {
    const { walletAddress, name, musicUrl, artist } = req.body;

    if (!walletAddress || !musicUrl) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing walletAddress or musicUrl' },
      });
    }

    const transactionXDR = await buildMintTransaction(
      walletAddress,
      name || 'Music NFT',
      musicUrl,
      artist || 'Unknown'
    );

    res.json({
      success: true,
      data: { transactionXDR },
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
    const { signedTxXDR, walletAddress, name, musicUrl, artist } = req.body;

    if (!signedTxXDR || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing signedTxXDR or walletAddress' },
      });
    }

    const result = await submitTransaction(signedTxXDR);

    const count = await MusicNFT.countDocuments();
    const tokenId = count + 1;

    const musicNFT = new MusicNFT({
      tokenId,
      name: name || 'Music NFT',
      artist: artist || 'Unknown',
      musicUrl,
      owner: walletAddress,
      walletAddress: walletAddress.toLowerCase(),
      txHash: result.txHash,
      contractAddress: process.env.NFT_CONTRACT_ID,
    });

    await musicNFT.save();

    res.json({
      success: true,
      data: {
        tokenId,
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