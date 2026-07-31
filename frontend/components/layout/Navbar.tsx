'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { cn } from '@/lib/utils';

const navLinks = [{ href: '/', label: 'Discover' }, { href: '/mint', label: 'Mint' }, { href: '/library', label: 'Vault' }];

export function Navbar() {
  const pathname = usePathname();
  return <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0d3a]/85 backdrop-blur-xl">
    <div className="page-shell flex h-[76px] items-center justify-between gap-5">
      <Link href="/" className="group flex items-center gap-3 shrink-0"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865f2] text-xl font-bold transition-transform group-hover:rotate-6">♫</span><span className="display text-xl tracking-[-.08em]">SOUNDVAULT</span></Link>
      <nav className="hidden items-center gap-2 md:flex">{navLinks.map(link => <Link key={link.href} href={link.href} className={cn('rounded-xl px-4 py-2 text-sm font-bold transition-colors', pathname === link.href ? 'bg-white text-[#0a0d3a]' : 'text-white/70 hover:bg-white/10 hover:text-white')}>{link.label}</Link>)}</nav>
      <WalletButton />
    </div>
  </header>;
}
