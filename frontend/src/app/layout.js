import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CampusConnect | Meet Your College Peers',
  description: 'Private video and text chat platform for college students.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.1),_transparent_50%)]" />
        {children}
      </body>
    </html>
  );
}
