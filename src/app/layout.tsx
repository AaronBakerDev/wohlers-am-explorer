import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Wohlers AM Market Explorer',
    template: '%s | Wohlers AM Market Explorer'
  },
  description: 'Interactive data visualization platform for North American additive manufacturing companies with powerful filtering, mapping, and analytics capabilities. Explore 156+ AM companies across 35 states and 3 provinces.',
  keywords: [
    'additive manufacturing', 
    '3D printing', 
    'market research', 
    'data visualization', 
    'manufacturing analytics',
    'Wohlers Associates',
    'AM companies',
    'North America',
    'manufacturing intelligence',
    'industry analysis'
  ],
  authors: [{ name: 'Wohlers Associates', url: 'https://wohlersassociates.com' }],
  creator: 'Wohlers Associates',
  publisher: 'Wohlers Associates',
  category: 'Technology',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  openGraph: {
    title: 'Wohlers AM Market Explorer',
    description: 'Interactive data visualization platform for North American additive manufacturing companies with powerful filtering, mapping, and analytics capabilities.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Wohlers AM Market Explorer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Wohlers AM Market Explorer Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wohlers AM Market Explorer',
    description: 'Interactive data visualization platform for North American additive manufacturing companies',
    images: ['/og-image.png'],
    creator: '@WohlersAssoc',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#6366f1',
      },
    ],
  },
  metadataBase: new URL('https://am-explorer.wohlersassociates.com'),
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try {
              const ls = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = ls ? ls === 'dark' : prefersDark;
              const el = document.documentElement;
              el.classList.toggle('dark', isDark);
              el.style.colorScheme = isDark ? 'dark' : 'light';
            } catch (_) {} })();`,
          }}
        />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  )
}
