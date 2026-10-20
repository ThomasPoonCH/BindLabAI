import { BetaDisclosure } from "@/components/BetaDisclosure";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "BindLab AI",
  icons: { icon: "/assets/bindlab-logo.png" },
  description: "A precision lab-prep intelligence platform for chemistry, biotech, pharmacy, and chemical biology students."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <BetaDisclosure />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
