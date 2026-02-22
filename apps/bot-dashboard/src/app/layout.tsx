import "~/styles/globals.css";

import { type Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Digi Support",
    template: "%s | Digi Support",
  },
  description: "View and manage your Digi support tickets",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-charcoal text-white antialiased">{children}</body>
    </html>
  );
}
