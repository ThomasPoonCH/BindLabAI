import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BindLab AI",
  description: "A precision lab-prep intelligence platform for chemistry, biotech, pharmacy, and chemical biology students."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
