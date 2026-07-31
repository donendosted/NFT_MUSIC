'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function ListTrackModal({ track, onClose, onListed }: { track: { tokenId: number; name: string; artist: string; contractAddress: string }; onClose: () => void; onListed: () => void }) {
  const { address, isConnected, connect, signTransaction } = useWallet();
  const [price, setPrice] = useState('1000000'); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState('');
  const submit = async () => { if (!isConnected || !address) { await connect(); return; } setSubmitting(true); setError(''); try {
    const buildResponse = await fetch(`${API_URL}/api/listing/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seller: address, tokenId: track.tokenId, price, contractAddress: track.contractAddress }) });
    const build = await buildResponse.json(); if (!buildResponse.ok || !build.success) throw new Error(build.error?.message || 'Unable to prepare listing');
    const signedTxXDR = await signTransaction(build.data.transactionXDR);
    const submitResponse = await fetch(`${API_URL}/api/listing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signedTxXDR, seller: address, tokenId: track.tokenId, price, contractAddress: track.contractAddress }) });
    const result = await submitResponse.json(); if (!submitResponse.ok || !result.success) throw new Error(result.error?.message || 'Listing failed'); onListed(); onClose();
  } catch (err: any) { setError(err.message || 'Listing failed'); } finally { setSubmitting(false); } };
  return <div className="fixed inset-0 z-[60] flex items-end bg-[#050720]/80 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-[32px] border border-white/15 bg-[#1e2353] p-6 shadow-2xl"><div className="flex justify-between"><div><p className="eyebrow">Release to the market</p><h2 className="display mt-2 text-3xl">LIST YOUR SOUND</h2></div><button onClick={onClose} className="text-2xl text-white/60">×</button></div><div className="mt-6 rounded-2xl bg-[#0a0d3a] p-4"><p className="font-bold">{track.name}</p><p className="text-sm text-white/60">{track.artist}</p></div><label className="mt-5 block text-sm font-bold">Price in stroops<input value={price} onChange={(event) => setPrice(event.target.value.replace(/\D/g, ''))} inputMode="numeric" className="input-field mt-2" /></label><p className="mt-2 text-xs text-white/45">1 XLM = 10,000,000 stroops. Listing escrows the NFT until sold.</p>{error && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}<button onClick={submit} disabled={submitting} className="btn-accent mt-6 w-full">{submitting ? 'Listing on Stellar…' : isConnected ? 'Confirm listing' : 'Connect Freighter'}</button></div></div>;
}
