import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import ScrollToTop from "@/components/scroll-to-top/ScrollToTop";
import { fetchNavServices, fetchPublishableCourses } from "@/lib/php-api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";
import { HOME_SEO } from "@/lib/page-metadata";

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
  title: HOME_SEO.title,
  description: HOME_SEO.description,
  authors: [{ name: "ASVAB Tutoring" }],
  verification: {
    google: "tjKoBlCs6zhgP7CiS7k0C2U86ENYzEWPPsErD0ffpSU",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [courses, services] = await Promise.all([
    fetchPublishableCourses(),
    fetchNavServices(),
  ]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning={true}
      >
        <ScrollToTop />
        <Navbar courses={courses} services={services} />
        <main className="site-main">{children}</main>
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
