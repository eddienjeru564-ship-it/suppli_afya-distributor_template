import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

/*
 * Newsreader, only as the page uses it: regular and italic at one weight, set at a display optical
 * size, Latin only (from Google Fonts, SIL Open Font License). About 47 KB together, against
 * 278 KB for the full variable family, which matters on prepaid mobile data.
 */
const newsreader = localFont({
  variable: "--font-newsreader",
  src: [
    { path: "./fonts/newsreader-48-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/newsreader-48-italic.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "Suppli Afya",
  // Phone numbers are shown and linked on purpose; stop iOS turning every number into a link.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ee",
  colorScheme: "light",
  viewportFit: "cover",
  // When the keyboard opens, shrink the page rather than covering the send button.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-KE" className={`${newsreader.variable} ${hanken.variable} antialiased`}>
      <body className="min-h-dvh">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
