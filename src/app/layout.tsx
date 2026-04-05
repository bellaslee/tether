import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import { PrivacyPolicyProvider } from '@/components/app/privacy-policy-context';
import './globals.css';

const bodyFont = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const displayFont = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Tether',
  description:
    'A warm, respectful relationship CRM for remembering people well.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PrivacyPolicyProvider>{children}</PrivacyPolicyProvider>
      </body>
    </html>
  );
}
