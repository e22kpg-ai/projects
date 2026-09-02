/*
 * ช่องทางสร้างบัญชีใหม่ให้คนอื่น (ไม่ใช่การสมัครด้วยตัวเอง)
 *
 * แยกจาก UserRepository โดยตั้งใจ: repository แก้แถวในตาราง user ที่มีอยู่แล้ว
 * ส่วนการ "สร้างบัญชี" ต้องมีการตั้งรหัสผ่านและ hash ซึ่งเป็นงานของผู้ให้บริการ auth
 * ไม่ใช่ของฐานข้อมูล — วันที่เปลี่ยนผู้ให้บริการ ตัวที่ต้องเขียนใหม่คือ adapter ตัวนี้ตัวเดียว
 */
export interface NewAccount {
  name: string;
  email: string;
  password: string;
  affiliation: string;
}

export interface AccountProvisioning {
  /**
   * สร้างบัญชีแล้วคืน id
   *
   * ★ บัญชีที่ได้ยังเป็น `pending` ตามค่าตั้งต้นของระบบเสมอ
   *   ใครจะให้เป็น approved ต้องสั่งอีกทีอย่างชัดเจน (ดู create-user.use-case.ts)
   *   ไม่ให้ adapter ตัดสินใจเรื่องสิทธิ์เอง
   */
  createAccount(input: NewAccount): Promise<{ id: string }>;
}
