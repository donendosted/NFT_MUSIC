'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/layout/WalletButton';
import { ListTrackModal } from '@/components/nft/ListTrackModal';

interface MusicNFT {
  _id: string;
  tokenId: number;
  contractAddress: string;
  name: string;
  artist: string;
  musicUrl: string;
  ipfsHash?: string;
  owner: string;
  txHash: string;
  createdAt: string;
  listing?: { active: boolean; listingId: string; price: string };
}

interface PurchaseHistoryItem {
  _id: string;
  purchaseId: string;
  listingId: string;
  buyer: string;
  seller: string;
  amount: string;
  ledger?: number;
  transactionHash: string;
  timestamp: string;
  status: string;
}

const DEFAULT_IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export default function LibraryPage() {
  const { address, isConnected } = useWallet();
  const [music, setMusic] = useState<MusicNFT[]>([]);
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingTrack, setListingTrack] = useState<MusicNFT | null>(null);

  const fetchMusic = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/music/${address}`);
      const data = await res.json();

      if (res.ok) {
        setMusic(data.data || []);
      }

      const purchaseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase/history/${address}`);
      const purchaseData = await purchaseRes.json();
      if (purchaseRes.ok) setPurchases(purchaseData.data || []);
    } catch (err) {
      console.error('Failed to fetch music:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchMusic();
    }
  }, [address]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="card p-12">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">Connect your Freighter wallet to view your library</p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10 sm:py-16">
      <div className="flex items-center justify-between mb-8">
        <div><p className="eyebrow mb-2">Collector archive</p><h1 className="display text-4xl">MY VAULT</h1></div>
        <button onClick={fetchMusic} className="btn-primary text-sm">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : music.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🎵</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Music Yet</h2>
          <p className="text-slate-400 mb-6">Mint your first music NFT to see it here</p>
          <a href="/mint" className="btn-accent">Start Minting</a>
        </div>
      ) : (
        <div className="space-y-4">
          {music.map((track) => {
            const resolvedMusicUrl =
              track.musicUrl || (track.ipfsHash ? `${DEFAULT_IPFS_GATEWAY}/${track.ipfsHash}` : '');
            return (
              <div key={track._id} className="card p-6 hover:border-[#5865f2]/70 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#5865f2] rounded-xl flex items-center justify-center text-2xl">
                    🎵
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                    <p className="text-slate-400">{track.artist}</p>
                    <p className="text-slate-500 text-sm">Token ID: {track.tokenId}</p>
                  </div>
                  <audio
                    src={resolvedMusicUrl}
                    controls
                    className="h-10"
                  />
                  {track.listing?.active ? <span className="rounded-lg bg-[#ec48bd] px-3 py-2 text-xs font-bold">Listed · {track.listing.price}</span> : <button onClick={() => setListingTrack(track)} className="btn-primary px-3 py-2 text-xs">List for sale</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between"><div><p className="eyebrow mb-2">On-chain receipts</p><h2 className="display text-3xl">PURCHASE HISTORY</h2></div><span className="text-sm text-white/50">{purchases.length} confirmed</span></div>
        {purchases.length === 0 ? <div className="card p-6 text-sm text-white/60">Your completed purchases will appear here with their Stellar transaction receipts.</div> : <div className="space-y-3">{purchases.map((purchase) => <div key={purchase._id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#35ed7e]">{purchase.amount} stroops <span className="ml-2 text-xs text-white/45">{purchase.status}</span></p><p className="mt-1 text-xs text-white/55">Listing #{purchase.listingId} · Ledger {purchase.ledger ?? '—'}</p></div><div className="flex items-center gap-2"><code className="rounded-lg bg-[#0a0d3a] px-3 py-2 text-xs">{purchase.transactionHash.slice(0, 10)}…{purchase.transactionHash.slice(-6)}</code><button onClick={() => navigator.clipboard.writeText(purchase.transactionHash)} className="rounded-lg bg-[#5865f2] px-3 py-2 text-xs font-bold">Copy</button><a href={`https://stellar.expert/explorer/testnet/tx/${purchase.transactionHash}`} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#0a0d3a]">Explorer ↗</a></div></div>)}</div>}
      </section>
      {listingTrack && <ListTrackModal track={listingTrack} onClose={() => setListingTrack(null)} onListed={fetchMusic} />}
    </div>
  );
}
