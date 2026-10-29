import "./globals.css";
import type { Metadata } from "next";
import { Outfit, Onest } from "next/font/google";
import { SITE_URL } from "@/constants";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const onest = Onest({ subsets: ["latin"], variable: "--font-onest" });

const title = "Uwumi - Stream Anime, Manga & Movies";
const description =
  "Feature-rich anime, manga and movie streaming app built with React Native and Expo. Download now for the ultimate entertainment experience.";

// The preview image is app/opengraph-image.png; /info pages swap in the shared title's poster
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { type: "website", siteName: "uwumi", url: "/", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className={`${outfit.variable} ${onest.variable}`} suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
