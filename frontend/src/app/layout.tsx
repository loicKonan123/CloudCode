import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudCode - IDE Collaboratif en Ligne",
  description: "Un IDE collaboratif en ligne pour coder ensemble en temps réel",
  keywords: ["IDE", "code", "collaboration", "programming", "online"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
