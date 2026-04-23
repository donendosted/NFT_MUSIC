import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/providers';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'NFT Music - Mint & Collect Music NFTs',
  description: 'Mint and collect music NFTs on Stellar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <QueryProvider>
          <Navbar />
          <main className="pb-20 lg:pb-0">{children}</main>
          <BottomNav />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#000',
                color: '#fff',
                border: '1px solid #333',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}