import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mumbai Travel Guru | Premium Flight, Hotel & Wallet Portal",
  description: "Book domestic and international flights, hotels, and holiday packages. Manage your secure Wallet, check transactions, and explore with Mumbai's premium travel portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${outfit.variable} font-sans min-h-full bg-slate-950 text-slate-100 antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
