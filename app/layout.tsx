import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import ScrollToTop from "@/components/scroll-to-top/ScrollToTop";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ASVAB Tutoring: ASVAB Tutor, ASTB, OAR, AFOQT, SIFT",
  description:
    "ASVAB Tutoring provides best one-on-one online tutoring for ASVAB, ASTB, OAR & AFOQT exams. Expert tutors, personalized lessons, and proven strategies to boost your test scores.",
  authors: [{ name: "ASVAB Tutoring" }],
  verification: {
    google: "tjKoBlCs6zhgP7CiS7k0C2U86ENYzEWPPsErD0ffpSU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning={true}
      >
        <ScrollToTop />
        <Navbar />
        {children}
        <Footer />

        {/* Google Analytics Implementation */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2TE0FG0NK3"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2TE0FG0NK3');
          `}
        </Script>
      </body>
    </html>
  );
}
