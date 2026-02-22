import "~/styles/globals.css";

import { type Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Digi Dashboard",
    template: "%s | Digi Dashboard",
  },
  description: "Manage your Digi microservices, deployments, and infrastructure.",
};

const calSans = localFont({
  src: "../../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  weight: "600",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={calSans.variable}>
      <body className="bg-charcoal font-sans text-white antialiased">
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
