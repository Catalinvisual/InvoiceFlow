import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Invoice App",
  description: "Invoice Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <Providers>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#fff',
                color: '#333',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              success: {
                style: {
                  background: '#22c55e', // green-500
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444', // red-500
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
