import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SSA Network — Built for something bigger",
  description:
    "A demonstration platform connecting Sikh students through seva, community, and shared impact.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
