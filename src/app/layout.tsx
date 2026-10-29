import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/newsreader/wght-italic.css';

import './globals.css';
import './site.css';

export const metadata: Metadata = {
  title: {
    default: 'Precedent: the weekly shop, handled',
    template: '%s · Precedent',
  },
  description:
    'Precedent learns how you like to shop, answers the small questions once, and handles the weekly restock from there.',
  applicationName: 'Precedent',
  openGraph: {
    title: 'Precedent: the weekly shop, handled',
    description:
      'A reorder agent that learns your rules and keeps the weekly shop moving.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f5f1e8',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
