import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHE PHIM AI — Control Room",
  description: "Bảng quản trị nội dung PHE PHIM AI",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}