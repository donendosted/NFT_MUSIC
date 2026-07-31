'use client';

import { useEffect, useState } from 'react';
import { DiscIcon } from './DiscIcon';
import { ListedTrack, PurchaseModal } from './PurchaseModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function MarketplaceDrops() {
  const [tracks, setTracks] = useState<ListedTrack[]>([]);
  const [selected, setSelected] = useState<ListedTrack | null>(null);
  const load = async () => { try { const response = await fetch(`${API_URL}/api/music?listed=true&limit=6`); const json = await response.json(); if (response.ok) setTracks(json.data || []); } catch {} };
  useEffect(() => { load(); }, []);

  return <section className="page-shell pb-16 sm:pb-24"><div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Fresh listings</p><h2 className="display text-4xl sm:text-5xl">AVAILABLE DROPS</h2></div><span className="text-sm text-white/55">Settled atomically on Stellar</span></div>{tracks.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tracks.map((track) => <article key={track._id} className="card flex min-h-[180px] flex-col p-5 transition-colors hover:border-[#5865f2]/70"><div className="flex items-start gap-4"><DiscIcon className="h-16 w-16 shrink-0" /><div className="min-w-0"><p className="text-xs font-bold tracking-widest text-[#35ed7e]">MUSIC NFT #{track.tokenId}</p><h3 className="mt-2 truncate text-xl font-bold">{track.name}</h3><p className="truncate text-sm text-white/60">{track.artist}</p></div></div><div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4"><span className="text-sm font-bold text-[#35ed7e]">{track.listing.price} stroops</span><button className="btn-primary shrink-0 px-4 py-2 text-sm" onClick={() => setSelected(track)}>Buy</button></div></article>)}</div> : <div className="card rounded-[32px] p-8 text-center text-white/65">No active drops yet. New music listings will land here.</div>}{selected && <PurchaseModal track={selected} onClose={() => setSelected(null)} onPurchased={() => { setSelected(null); load(); }} />}</section>;
}
