import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ToastViewport } from "@/components/ui/toast/ToastViewport";
import "@/styles/index.css";

/*
 * ทั้งแอปเป็นภาษาไทย ฟอนต์หลักจึงต้องมี subset "thai"
 * ไม่งั้นตัวไทยจะตกไปใช้ fallback ของ OS ซึ่งหน้าตาไม่เหมือนกันเลยในแต่ละเครื่อง
 * IBM Plex Sans Thai ไม่ใช่ variable font ต้องระบุ weight ที่ใช้จริงให้ครบ
 */
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* เก็บไว้สำหรับตัวเลข/เวลาในปฏิทินที่ต้องเรียงตรงคอลัมน์ */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม",
  description: "จองห้องประชุมภายในองค์กร",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /*
     * suppressHydrationWarning จำเป็น เพราะ ThemeScript ใส่ data-skin/data-theme ให้ <html>
     * ตั้งแต่ก่อน React hydrate — attribute ฝั่ง server กับ client จึงไม่ตรงกันโดยตั้งใจ
     */
    <html
      lang="th"
      className={`${plexThai.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      {/* สี/ฟอนต์ของ body ตั้งไว้ที่ index.css แล้ว ที่นี่เหลือแค่โครง layout */}
      <body className="min-h-full flex flex-col">
        {children}
        {/* client leaf ตัวเดียว ไม่ได้ห่อ children จึงไม่ลากทั้งแอปข้ามฝั่ง */}
        <ToastViewport />
      </body>
    </html>
  );
}
