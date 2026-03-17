import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "สานสัมพันธ์ 3 คณะ | ค่ายสามสัญจร สอนสัมพันธ์ ครั้งที่ 2",
  description:
    "Buddy Matching Game สำหรับค่ายสามสัญจร สอนสัมพันธ์ ครั้งที่ 2 — วิศวะ × วิทย์ × เภสัช จุฬาลงกรณ์มหาวิทยาลัย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Mitr:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
