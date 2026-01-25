import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

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
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}