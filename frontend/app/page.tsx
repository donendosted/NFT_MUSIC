'use client';

import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/layout/WalletButton';
import { MarketplaceDrops } from '@/components/nft/MarketplaceDrops';

function SoundOrb() {
  return <div className="relative mx-auto h-[300px] w-[300px] sm:h-[390px] sm:w-[390px]" aria-hidden="true">
    <div className="absolute inset-0 rounded-full border border-white/20 animate-[spin_20s_linear_infinite]" />
    <div className="absolute inset-7 rounded-full border border-dashed border-[#35ed7e]/80" />
    <div className="absolute inset-14 rounded-full bg-gradient-to-br from-[#ec48bd] via-[#7b59f1] to-[#35ed7e] shadow-[0_0_70px_rgba(236,72,189,.6)]" style={{ animation: 'float 5s ease-in-out infinite' }} />
    <div className="absolute inset-[5.5rem] sm:inset-[7.5rem] rounded-full bg-[#0a0d3a] flex items-center justify-center text-7xl sm:text-8xl shadow-2xl">♫</div>
    <div className="absolute -right-4 top-12 rounded-2xl bg-[#1e2353] p-4 shadow-xl border border-white/10 rotate-6"><span className="block text-[10px] font-bold tracking-widest text-[#35ed7e]">NOW PLAYING</span><span className="text-sm font-bold">Own the sound</span></div>
    <div className="absolute -left-2 bottom-10 rounded-2xl bg-white px-4 py-3 text-[#0a0d3a] shadow-xl -rotate-6"><span className="block text-xs font-bold">STELLAR POWERED</span><span className="text-[10px]">music made collectible</span></div>
  </div>;
}

export default function HomePage() {
  const { isConnected } = useWallet();
  return <>
    <section className="hero-mesh border-b border-white/10">
      <div className="page-shell grid min-h-[650px] items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div className="relative z-10">
          <p className="eyebrow mb-5"><span className="h-2 w-2 rounded-full bg-[#35ed7e]" /> On Stellar testnet</p>
          <h1 className="display max-w-3xl text-[clamp(3.5rem,8vw,6.7rem)] leading-[.86]">MUSIC<br />YOU CAN<br /><span className="text-[#35ed7e]">OWN.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">Drop your tracks, mint on Stellar, and collect the next sound to move the culture. Your music deserves more than a stream.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isConnected ? <Link href="/mint" className="btn-accent text-lg">Mint on Stellar <span className="ml-2">↗</span></Link> : <WalletButton />}
            <Link href="/library" className="btn-secondary text-lg">Explore your vault</Link>
          </div>
        </div>
        <SoundOrb />
      </div>
    </section>

    <div className="overflow-hidden bg-[#5865f2] py-5"><div className="display whitespace-nowrap text-center text-3xl text-white sm:text-5xl">MINT · COLLECT · PLAY · REPEAT · MINT · COLLECT · PLAY · REPEAT ·</div></div>

    <section className="page-shell py-16 sm:py-24">
      <div className="mb-10 max-w-2xl"><p className="eyebrow mb-3">The new music economy</p><h2 className="display text-4xl leading-none sm:text-6xl">A LOUDER WAY TO RELEASE.</h2></div>
      <div className="grid gap-5 md:grid-cols-2">
        <article className="gradient-card min-h-[330px] rounded-[40px] p-8 sm:p-10"><p className="text-sm font-bold tracking-widest">01 / CREATE</p><h3 className="display mt-10 max-w-md text-4xl leading-none sm:text-5xl">TURN TRACKS INTO DIGITAL ORIGINALS.</h3><div className="mt-7 flex gap-2">{[.4,.8,.55,1,.7,.35,.9].map((v, i) => <span key={i} className="w-3 rounded-full bg-white" style={{ height: `${v * 48}px`, animation: `bars ${.7 + i / 7}s ease-in-out infinite` }} />)}</div></article>
        <article className="card flex min-h-[330px] flex-col justify-between p-8 sm:p-10"><div><p className="text-sm font-bold tracking-widest text-[#35ed7e]">02 / COLLECT</p><h3 className="display mt-6 max-w-md text-4xl leading-none sm:text-5xl">YOUR VAULT. YOUR SOUND.</h3></div><div className="rounded-2xl border border-white/10 bg-[#0a0d3a] p-5"><div className="flex items-center justify-between text-sm"><span className="font-bold">STELLAR VAULT</span><span className="rounded-md bg-[#ec48bd] px-2 py-1 text-xs font-bold">ON-CHAIN</span></div><div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-[#35ed7e]" /></div></div></article>
      </div>
    </section>

    <MarketplaceDrops />
    <section className="page-shell pb-16 sm:pb-24"><div className="rounded-[40px] bg-[#5865f2] px-7 py-12 text-center sm:px-12 sm:py-16"><p className="eyebrow justify-center text-white/75">Open to every sound</p><h2 className="display mx-auto mt-4 max-w-4xl text-4xl leading-none sm:text-6xl">MAKE THE FIRST DROP COUNT.</h2><p className="mx-auto mt-5 max-w-xl text-lg text-white/80">Connect Freighter, upload your track, and mint its next chapter on Stellar.</p><Link href="/mint" className="btn-accent mt-8 text-lg">Mint on Stellar</Link></div></section>
  </>;
}
