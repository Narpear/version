import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ToastProvider from "@/components/ui/ToastProvider";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Version - Wellbeing Tracker",
  description: "Track your fitness, food, and wellness journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <ThemeToggle />
        </ToastProvider>
      </body>
    </html>
  );
}