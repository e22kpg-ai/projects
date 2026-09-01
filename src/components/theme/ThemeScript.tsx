import {
  DEFAULT_MODE,
  DEFAULT_SKIN,
  MODES,
  SKINS,
  THEME_STORAGE_KEY,
} from "./theme-config";

/*
 * สคริปต์ blocking ที่ต้องรันก่อน browser paint เพื่อกัน FOUC
 * (zustand persist จะ rehydrate หลัง mount ซึ่งช้าไป จะเห็นธีมกระพริบหนึ่งเฟรม)
 *
 * ค่าคงที่ทุกตัวถูก inject มาจาก theme-config.ts ไม่พิมพ์ซ้ำ
 * ถ้าวันหลังเปลี่ยนชื่อ storage key แล้วลืมแก้ที่นี่ FOUC จะกลับมาแบบเงียบๆ ไม่มี error ให้เห็น
 */
const script = `(function(){try{
var skins=${JSON.stringify(SKINS.map((s) => s.id))};
var modes=${JSON.stringify(MODES.map((m) => m.id))};
var skin=${JSON.stringify(DEFAULT_SKIN)},mode=${JSON.stringify(DEFAULT_MODE)};
var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(raw){var s=(JSON.parse(raw)||{}).state||{};
if(skins.indexOf(s.skin)>-1)skin=s.skin;
if(modes.indexOf(s.mode)>-1)mode=s.mode;}
var r=document.documentElement;r.dataset.skin=skin;
if(mode==="system"){delete r.dataset.theme;}else{r.dataset.theme=mode;}
}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
