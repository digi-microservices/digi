import "~/styles/globals.css";

import { type Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";

const calSans = localFont({
  src: "../../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  weight: "600",
});

export const metadata: Metadata = {
  title: {
    default: "Digi Admin",
    template: "%s | Digi Admin",
  },
  description: "Digi platform administration dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={calSans.variable}>
      <body className="bg-charcoal text-white antialiased">
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
