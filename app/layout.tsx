import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Discover · Coy',
  description: 'Discover new people and reveal a match when the interest is mutual.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
