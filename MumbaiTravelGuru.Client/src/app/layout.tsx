import type { Metadata } from "next";
import { DM_Serif_Display, Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { SearchProvider } from "@/context/SearchContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileSearchOverlay from "@/components/MobileSearchOverlay";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

const onest = Onest({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Mumbai Travel Guru | Flights, Hotels, Bus, Cabs & Holiday Packages",
  description:
    "Book domestic and international flights, hotels, bus tickets, cabs, and holiday packages. Mumbai's own travel marketplace with secure wallet and instant refunds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${onest.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased bg-sea-deep text-paper min-h-dvh pb-14 lg:pb-0">
        <Providers>
          <SearchProvider>
            {children}
            <MobileBottomNav />
            <MobileSearchOverlay />
          </SearchProvider>
        </Providers>
      </body>
    </html>
  );
}
