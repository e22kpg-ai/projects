import type { DressCode } from "@/core/domain/entities/booking";

export const DRESS_CODE_OPTIONS: { value: DressCode; label: string }[] = [
  { value: "long_sleeve_uniform", label: "เครื่องแบบแขนยาวคอพับ" },
  { value: "duty_uniform", label: "ชุดปฏิบัติงานตาม รปจ." },
  { value: "unspecified", label: "ไม่กำหนด" },
];

export const DRESS_CODE_LABELS = Object.fromEntries(
  DRESS_CODE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DressCode, string>;
