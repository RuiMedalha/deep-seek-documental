import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deep Seek Documental',
  description: 'SaaS de gestão documental e conciliação financeira',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}