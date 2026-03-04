import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Today's Quote — Meet a mind",
  description: "Discover inspiring quotes from remarkable people, one at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
