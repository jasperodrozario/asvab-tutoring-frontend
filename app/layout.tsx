import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASVAB Tutoring: ASVAB Tutor, ASTB, OAR, AFOQT, SIFT Tutoring",
  description: "ASVAB Tutoring.com is a one-on-one online tutoring program. We provide high-quality tutoring services for ASVAB, ASTB, OAR, and AFOQT tests",
  authors: [{ name: "ASVAB Tutoring" }],
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
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
