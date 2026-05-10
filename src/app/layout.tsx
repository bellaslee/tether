import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Fraunces, Nunito } from 'next/font/google';
import { PrivacyPolicyProvider } from '@/components/app/privacy-policy-context';
import './globals.css';

const themeBootstrapScript = `
(function() {
  try {
    var storedTheme = window.localStorage.getItem('tether-theme');
    var theme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark));
  } catch (_) {}
})();
`;

const bodyFont = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const displayFont = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
});

export const metadata: Metadata = {
  title: 'Tether',
  description:
    'A warm, respectful relationship PRM for remembering people well.',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#fff8f0',
  interactiveWidget: 'resizes-content',
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
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="flex min-h-full min-w-0 flex-col">
        <PrivacyPolicyProvider>{children}</PrivacyPolicyProvider>
        <Analytics />
      </body>
    </html>
  );
}
