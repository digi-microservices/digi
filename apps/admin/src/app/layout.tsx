import "~/styles/globals.css";

import { type Metadata } from "next";

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
    <html lang="en">
      <body className="bg-neutral-950 text-white antialiased">{children}</body>
    </html>
  );
}
