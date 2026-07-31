import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/providers';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'NFT Music - Mint & Collect Music NFTs',
  description: 'Mint and collect music NFTs on Stellar',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0d3a] text-white">
        <QueryProvider>
          <Navbar />
          <main className="pb-20 lg:pb-0">{children}</main>
          <BottomNav />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e2353',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.12)',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
