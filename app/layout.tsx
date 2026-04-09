import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ToastProvider from "@/components/ui/ToastProvider";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFB5E8',
};

export const metadata: Metadata = {
  title: "Version - Wellbeing Tracker",
  description: "Track your fitness, food, and wellness journey",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Version",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <ToastProvider>
          <Navigation />
          {/* pb-24 gives space for the floating pill bottom nav; removed on md+ */}
          <main className="min-h-screen pb-24 md:pb-0">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
