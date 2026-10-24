import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Precedent — memory as case law',
  description:
    'An agent that remembers your rules, and cites them before it spends your money.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
