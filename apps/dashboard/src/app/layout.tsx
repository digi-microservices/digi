import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: {
    default: "Digi Dashboard",
    template: "%s | Digi Dashboard",
  },
  description: "Manage your Digi microservices, deployments, and infrastructure.",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-neutral-950 font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
