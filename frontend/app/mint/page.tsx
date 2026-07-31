'use client';

import { useState, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/layout/WalletButton';
import toast from 'react-hot-toast';

export default function MintPage() {
  const { address, isConnected, signTransaction } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [musicName, setMusicName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedIpfsHash, setUploadedIpfsHash] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setMusicName(file.name.replace(/\.[^/.]+$/, ''));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setAudioPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAudioPreview(null);
    setMusicName('');
    setArtistName('');
    setUploadedUrl(null);
    setUploadedIpfsHash(null);
    setMintResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !address) return;

    setUploading(true);
    toast.loading('Uploading to IPFS...', { id: 'upload' });

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('walletAddress', address);
      formData.append('name', musicName || selectedFile.name);
      formData.append('artist', artistName || 'Unknown');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

      setUploadedUrl(data.data.url);
      setUploadedIpfsHash(data.data.ipfsHash);
      toast.success('Uploaded to IPFS!', { id: 'upload' });
    } catch (err: any) {
      toast.error(err.message, { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleMint = async () => {
    if (!uploadedIpfsHash || !address) return;

    setMinting(true);
    toast.loading('Building transaction...', { id: 'mint' });

    try {
      const buildRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mint/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          name: musicName || 'Music NFT',
          ipfsHash: uploadedIpfsHash,
          artist: artistName || 'Unknown',
        }),
      });

      const buildData = await buildRes.json();

      if (!buildRes.ok) throw new Error(buildData.error?.message || 'Build failed');

      toast.loading('Sign with Freighter...', { id: 'mint' });

      const signedXDR = await signTransaction(buildData.data.transactionXDR);

      toast.loading('Submitting transaction...', { id: 'mint' });

      const submitRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mint/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedTxXDR: signedXDR,
          walletAddress: address,
          name: musicName || 'Music NFT',
          ipfsHash: uploadedIpfsHash,
          artist: artistName || 'Unknown',
        }),
      });

      const submitData = await submitRes.json();

      if (!submitRes.ok) throw new Error(submitData.error?.message || 'Mint failed');

      setMintResult(submitData.data);
      toast.success('Music NFT minted!', { id: 'mint' });
    } catch (err: any) {
      toast.error(err.message, { id: 'mint' });
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="card p-12">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">Connect your Freighter wallet to mint music NFTs</p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-3xl py-10 sm:py-16">
      <p className="eyebrow mb-2">Release studio</p>
      <h1 className="display text-4xl sm:text-5xl mb-8">MINT ON STELLAR</h1>

      {mintResult ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">Minted Successfully!</h2>
          <p className="text-slate-400 mb-4">Token ID: {mintResult.tokenId}</p>
          {mintResult.ipfsHash ? (
            <p className="text-slate-500 text-xs mb-4 break-all">IPFS: {mintResult.ipfsHash}</p>
          ) : null}
          <a
            href={mintResult.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mb-4 inline-block"
          >
            View on Explorer
          </a>
          <br />
          <button onClick={handleReset} className="btn-secondary">
            Mint Another
          </button>
        </div>
      ) : (
        <>
          <div className="card p-6 mb-6">
            <label className="block text-sm font-medium text-white mb-2">Upload Music File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-[#35ed7e] transition-colors bg-[#121746]/50"
              >
                <div className="text-4xl mb-2">🎵</div>
                <p className="text-slate-400">Click to upload audio file</p>
                <p className="text-slate-500 text-sm mt-1">MP3, WAV, FLAC up to 50MB</p>
              </button>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl">
                <div className="text-3xl">🎵</div>
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button onClick={handleReset} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {audioPreview && (
              <audio controls src={audioPreview} className="w-full mt-4" />
            )}
          </div>

          <div className="card p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Track Name</label>
                <input
                  type="text"
                  value={musicName}
                  onChange={(e) => setMusicName(e.target.value)}
                  placeholder="My Awesome Track"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Artist Name</label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Artist Name"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {!uploadedUrl ? (
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="btn-primary flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload to IPFS'}
              </button>
            ) : (
              <div className="flex-1">
                {uploadedIpfsHash ? (
                  <p className="text-slate-500 text-xs mb-2 break-all">
                    Uploaded hash: {uploadedIpfsHash}
                  </p>
                ) : null}
                <button
                  onClick={handleMint}
                  disabled={minting || !uploadedIpfsHash}
                  className="btn-accent w-full"
                >
                  {minting ? 'Minting on Stellar...' : 'Mint on Stellar'}
                </button>
              </div>
            )}
          </div>

          {uploadedUrl && (
            <p className="text-slate-400 text-sm mt-4 text-center break-all">
              IPFS: {uploadedUrl}
            </p>
          )}
        </>
      )}
    </div>
  );
}
