"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import "./globals.css";
import Script from "next/script";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const isAdminOrAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth/admin") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register");

  const hideNavbar = pathname === "/" || isAdminOrAuth;
  const hideFooter = isAdminOrAuth;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />

        {!hideNavbar && <Navbar />}
        <div className="flex-1">{children}</div>
        {!hideFooter && <Footer />}
        {!isAdminOrAuth && <Chatbot />}
      </body>
    </html>
  );
}
