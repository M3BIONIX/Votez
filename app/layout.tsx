import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from "react";
import { AuthProvider } from '@/lib/auth-store';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Votez',
  description: 'A simple app to create Votez',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
