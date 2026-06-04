import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bythepeopleforthepeople.com"),
  title: {
    default: "By The People, For The People",
    template: "%s | By The People, For The People",
  },
  description:
    "Public decision intelligence for bills, amendments, votes, hearings, source trails, and local government records. Source-anchored. Nonpartisan.",
  applicationName: "By The People, For The People",
  authors: [{ name: "By The People, For The People" }],
  keywords: [
    "government accountability",
    "public records",
    "civic technology",
    "bill tracker",
    "council file",
    "roll call vote",
    "source provenance",
    "nonpartisan",
  ],
  openGraph: {
    title: "By The People, For The People",
    description:
      "Understand how public decisions actually get made through factual timelines and primary source records.",
    url: "https://bythepeopleforthepeople.com",
    siteName: "By The People, For The People",
    type: "website",
    images: ["/og/proof"],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "By The People, For The People",
    description:
      "Government accountability the public can actually use. Source-anchored, nonpartisan.",
    images: ["/og/proof"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": [{ url: "/feed.xml", title: "Civic-record changes" }],
      "text/calendar": [{ url: "/calendar.ics", title: "Upcoming civic milestones" }],
      "application/opensearchdescription+xml": [
        { url: "/opensearch.xml", title: "Search By The People, For The People" },
      ],
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "By The People",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
    other: [{ rel: "mask-icon", url: "/icon-maskable.svg", color: "#07111f" }],
  },
};

export const viewport = {
  themeColor: "#07111f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <JsonLd data={[websiteSchema(), organizationSchema()]} />
      </body>
    </html>
  );
}
