import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Helpernote - 소개소 관리 시스템",
    template: "%s | Helpernote"
  },
  description: "소개소를 위한 통합 고객 관리 및 매칭 플랫폼. 고용주와 근로자를 효율적으로 연결하고, 매칭 현황과 수수료를 체계적으로 관리하세요.",
  keywords: ["소개소", "구인구직", "매칭", "고객관리", "CRM", "헬퍼노트"],
  authors: [{ name: "Helpernote Team" }],
  creator: "Helpernote",
  publisher: "Helpernote",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Helpernote - 소개소 관리 시스템",
    description: "소개소를 위한 통합 고객 관리 및 매칭 플랫폼",
    url: '/',
    siteName: 'Helpernote',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Helpernote - 소개소 관리 시스템',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Helpernote - 소개소 관리 시스템",
    description: "소개소를 위한 통합 고객 관리 및 매칭 플랫폼",
    images: ['/images/og-image.png'],
  },
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo-icon.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
