"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  clampISODate,
  formatThaiLong,
  formatThaiMonthYear,
  isOutOfRange,
  monthKey,
  parseISODate,
  THAI_WEEKDAYS_SHORT,
  todayISO,
} from "./date-utils";
import { useFieldControl } from "./field-context";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import type { ISODate } from "./types";
import { useAnchoredPosition } from "./use-anchored-position";
import { useControllableState } from "./use-controllable-state";
import { useDismiss } from "./use-dismiss";
import { useFocusTrap } from "./use-focus-trap";

/*
 * ปฏิทินเลือกวันแบบเขียนเอง แทน <input type="date"> ที่หน้าตาไม่เหมือนกันเลยทุกเบราว์เซอร์
 *
 * ★ แสดงเป็น พ.ศ. แต่ค่าที่ส่งออกเป็น ค.ศ. "YYYY-MM-DD" เสมอ (ดูเหตุผลใน date-utils.ts)
 *
 * ★ โมเดลโฟกัสต่างจาก Select โดยตั้งใจ:
 *   Select โฟกัสค้างที่ trigger แล้วชี้ด้วย aria-activedescendant
 *   แต่ตารางปฏิทินเป็น grid pattern — screen reader ต้องอ่าน aria-selected / aria-current / aria-label
 *   ของช่องที่โฟกัสจริง จึงใช้ roving tabindex ย้ายโฟกัสเข้าไปในตารางจริงๆ
 */

export interface DatePickerProps {
  name?: string;
  value?: ISODate;
  defaultValue?: ISODate;
  onValueChange?: (value: ISODate) => void;
  min?: ISODate;
  max?: ISODate;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  form?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  name,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  placeholder = "เลือกวันที่",
  disabled,
  required,
  id,
  form,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const a11y = useFieldControl({
    id,
    required,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  });

  const [current, setCurrent] = useControllableState(value, defaultValue ?? "", onValueChange);
  const [open, setOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState<ISODate>(() =>
    clampISODate(current || todayISO(), min, max),
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);

  const uid = useId();
  const titleId = `${uid}t`;

  useAnchoredPosition(triggerRef, floatingRef, open, { offset: 4 });

  const close = useCallback(() => setOpen(false), []);
  useDismiss({ active: open, onDismiss: close, refs: [rootRef, floatingRef] });
  useFocusTrap(floatingRef, open);

  const today = todayISO();
  const viewMonth = monthKey(focusedDate);
  const cells = buildMonthGrid(focusedDate);

  function openMenu() {
    if (disabled) return;
    setFocusedDate(clampISODate(current || today, min, max));
    setOpen(true);
  }

  const commit = useCallback(
    (iso: ISODate) => {
      if (isOutOfRange(iso, min, max)) return;
      setCurrent(iso);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [max, min, setCurrent],
  );

  /* ย้ายโฟกัสจริงไปที่ช่องที่ roving ชี้อยู่ — ทำหลัง render เพื่อให้ปุ่มมีอยู่ใน DOM แล้ว */
  useEffect(() => {
    if (!open) return;
    floatingRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${focusedDate}"]`)
      ?.focus();
  }, [open, focusedDate]);

  function moveFocus(next: ISODate) {
    /* ชนขอบช่วงที่อนุญาตแล้วให้หยุด ไม่ใช่กระโดดข้าม */
    setFocusedDate(clampISODate(next, min, max));
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const { key, shiftKey } = event;

    const moves: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(focusedDate, -1),
      ArrowRight: () => addDays(focusedDate, 1),
      ArrowUp: () => addDays(focusedDate, -7),
      ArrowDown: () => addDays(focusedDate, 7),
      PageUp: () => addMonths(focusedDate, shiftKey ? -12 : -1),
      PageDown: () => addMonths(focusedDate, shiftKey ? 12 : 1),
      Home: () => addDays(focusedDate, -parseISODate(focusedDate).getDay()),
      End: () => addDays(focusedDate, 6 - parseISODate(focusedDate).getDay()),
    };

    const move = moves[key];
    if (move) {
      event.preventDefault();
      moveFocus(move());
      return;
    }

    if (key === "Enter" || key === " ") {
      event.preventDefault();
      commit(focusedDate);
    }
  }

  return (
    <div ref={rootRef} className={cx("select-root", className)}>
      {name && <input type="hidden" name={name} value={current} form={form} />}

      {/*
        ปุ่มธรรมดาไม่รองรับ aria-invalid / aria-required (ต่างจาก Select ที่เป็น role="combobox")
        สถานะ error จึงสื่อผ่านข้อความใน <Field> ที่ผูกไว้ด้วย aria-describedby แทน
      */}
      <button
        ref={triggerRef}
        type="button"
        id={a11y.id}
        disabled={disabled}
        className="select-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={a11y["aria-describedby"]}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="size-4 shrink-0 text-muted" />
          <span className={current ? undefined : "select-placeholder"}>
            {current ? formatThaiLong(current) : placeholder}
          </span>
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={floatingRef}
            className="popover calendar-popover anchored"
            role="dialog"
            aria-label="เลือกวันที่"
            onKeyDown={handleGridKeyDown}
          >
            <div className="calendar-header">
              <button
                type="button"
                className="btn-ghost btn-icon"
                aria-label="เดือนก่อนหน้า"
                onClick={() => moveFocus(addMonths(focusedDate, -1))}
              >
                <ChevronLeftIcon />
              </button>
              <span id={titleId} className="calendar-title" aria-live="polite">
                {formatThaiMonthYear(focusedDate)}
              </span>
              <button
                type="button"
                className="btn-ghost btn-icon"
                aria-label="เดือนถัดไป"
                onClick={() => moveFocus(addMonths(focusedDate, 1))}
              >
                <ChevronRightIcon />
              </button>
            </div>

            <div role="grid" aria-labelledby={titleId}>
              <div role="row" className="calendar-weekdays">
                {THAI_WEEKDAYS_SHORT.map((day) => (
                  <span key={day} role="columnheader">
                    {day}
                  </span>
                ))}
              </div>

              {Array.from({ length: cells.length / 7 }, (_, week) => (
                <div role="row" key={week} className="calendar-week">
                  {cells.slice(week * 7, week * 7 + 7).map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      role="gridcell"
                      data-date={iso}
                      /* roving tabindex: มีช่องเดียวเท่านั้นที่อยู่ในลำดับ Tab */
                      tabIndex={iso === focusedDate ? 0 : -1}
                      aria-selected={iso === current}
                      aria-current={iso === today ? "date" : undefined}
                      /* ให้ screen reader อ่าน "1 กันยายน 2569" ไม่ใช่แค่ "1" */
                      aria-label={formatThaiLong(iso)}
                      disabled={isOutOfRange(iso, min, max)}
                      data-outside={monthKey(iso) !== viewMonth ? "" : undefined}
                      className="calendar-day"
                      onClick={() => commit(iso)}
                    >
                      {parseISODate(iso).getDate()}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
