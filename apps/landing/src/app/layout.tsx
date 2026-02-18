import "~/styles/globals.css";

import { type Metadata } from "next";
import { Cal_Sans } from "next/font/google";
import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://digi.bnhm.dev"),

  title: {
    default: "Digi - Microservice infrastructure for the modern web.",
    template: "%s | Digi",
  },

  description:
    "Deploy lightweight microservices with ease. Small VMs (1 vCPU, 512MB RAM), managed databases, caching solutions, and application hosting — purpose-built for modern APIs and small-scale services.",

  keywords: [
    "Full-stack Development",
    "Infrastructure Engineering",
    "Network Engineering",
    "Software Development",
    "DevOps",
    "Web Development",
    "React Development",
    "Node.js Development",
    "Cloud Infrastructure",
    "AWS",
    "Docker",
    "Kubernetes",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "System Administration",
    "Network Security",
    "Database Design",
    "API Development",
    "Microservices",
    "CI/CD",
  ],


  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://digi.bnhm.dev",
    siteName: "Digi",
    title: "Digi - Microservice infrastructure for the modern web.",
    description:
      "Deploy lightweight microservices with ease. Small VMs (1 vCPU, 512MB RAM), managed databases, caching solutions, and application hosting — purpose-built for modern APIs and small-scale services.",
    images: [
      {
        url: "/banner.png",
        width: 1584,
        height: 396,
        alt: "Digi - Microservice infrastructure for the modern web.",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "digi",
    creator: "@digi",
    title: "Digi - Microservice infrastructure for the modern web.",
    description: "Deploy lightweight microservices with ease. Small VMs (1 vCPU, 512MB RAM), managed databases, caching solutions, and application hosting — purpose-built for modern APIs and small-scale services.",
    images: ["/banner.png"],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  category: "Technology",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  other: {
    "contact:email": "digi@bnhm.dev", // Replace with your actual email
    "geo.region": "GB",
    "geo.placename": "United Kingdom",
  },
};

const calsans = Cal_Sans({
  weight: "400",
  variable: "--font-calsans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${calsans.variable}`}>
      <Navbar/>
      <body>{children}</body>
    </html>
  );
}
