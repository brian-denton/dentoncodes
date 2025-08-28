import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Script from "next/script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "DentonCodes — AI-Powered Landing",
  description: "A modern one-page site with AI-generated copy.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash by setting the initial theme before React mounts */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const theme = localStorage.getItem('theme') || 'system';
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
              if (isDark) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch {}
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh`}>
        {children}
      </body>
    </html>
  )
}

