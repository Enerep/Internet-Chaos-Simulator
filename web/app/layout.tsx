import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://internet-chaos-simulator.bato.chatgpt.site'),
  title: 'Internet Chaos Simulator',
  description: 'Explore how internet traffic reroutes when critical infrastructure fails.',
  openGraph: {
    title: 'Internet Chaos Simulator',
    description: 'Cut the cable. Watch traffic find another way.',
    type: 'website',
    images: [{
      url: '/og.png',
      width: 1732,
      height: 910,
      alt: 'Internet Chaos Simulator over a dark map of global network routes',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Internet Chaos Simulator',
    description: 'Cut the cable. Watch traffic find another way.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
