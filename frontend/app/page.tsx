'use client';

import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/layout/WalletButton';

export default function HomePage() {
  const { isConnected } = useWallet();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-white mb-4">
          NFT Music Marketplace
        </h1>
        <p className="text-xl text-slate-400 mb-8">
          Mint and collect unique music NFTs on Stellar
        </p>

        {!isConnected ? (
          <div className="card p-8 max-w-md mx-auto">
            <p className="text-slate-400 mb-6">Connect your wallet to start minting</p>
            <WalletButton />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/mint" className="btn-accent text-lg px-8 py-4">
              Mint Your Music
            </a>
            <a href="/library" className="btn-primary text-lg px-8 py-4">
              My Library
            </a>
          </div>
        )}
      </div>
    </div>
  );
}