import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Helpernote - 취업 알선 중개 플랫폼",
    template: "%s | Helpernote",
  },
  description: "구인자와 구직자를 연결하는 전문 취업 알선 중개 서비스",
  keywords: ["취업", "구인", "구직", "매칭", "중개", "인력", "채용"],
  authors: [{ name: "Helpernote Team" }],
  creator: "Helpernote",
  publisher: "Helpernote",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "Helpernote - 취업 알선 중개 플랫폼",
    description: "구인자와 구직자를 연결하는 전문 취업 알선 중개 서비스",
    siteName: "Helpernote",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
