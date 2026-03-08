import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudCode - Coding Challenges Platform",
  description: "Resolve coding challenges in Python and JavaScript",
  keywords: ["coding", "challenges", "leetcode", "python", "javascript"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${firaCode.variable} antialiased`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
