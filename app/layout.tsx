import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Dorsera Memorial',
    template: '%s · Dorsera Memorial',
  },
  description:
    'Memoriales digitales que preservan el legado de quienes han partido, accesibles mediante un código QR.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
