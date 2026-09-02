import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /*
     * เทสต์ชุดนี้จงใจเป็น pure TypeScript ล้วน (core + utils) ไม่มี DOM ไม่มี DB
     * จึงไม่ต้องลง jsdom และรันได้เร็วพอที่จะรันทุกครั้งก่อน commit
     */
    environment: "node",
    include: ["src/**/*.test.ts"],
    /* ตรึง timezone ให้ตรงกับ production เพื่อไม่ให้เทสต์วันเวลาเปลี่ยนผลตามเครื่องที่รัน */
    env: { TZ: "Asia/Bangkok" },
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
