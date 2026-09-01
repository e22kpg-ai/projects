"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { useFieldControl } from "./field-context";
import { CheckIcon, ChevronDownIcon } from "./Icons";
import type { SelectOption, Size } from "./types";
import { useAnchoredPosition } from "./use-anchored-position";
import { useControllableState } from "./use-controllable-state";
import { useDismiss } from "./use-dismiss";

/*
 * Select แบบ custom เต็ม — เป็นตัวเดียวใน library นี้ที่ไม่ห่อ native element
 *
 * เหตุผลที่ต้อง custom: native <select> สไตล์ตัว dropdown ไม่ได้จริงๆ ทุกเบราว์เซอร์วาดเอง
 * (ต่างจาก checkbox/radio/switch ที่ซ่อน native ไว้ข้างในแล้ววาดทับได้ ดูไฟล์พวกนั้นประกอบ)
 *
 * ★ หัวใจที่ทำให้ของเดิมไม่พัง: hidden input ข้างใน
 *   Server Action `createBookingAction` อ่านค่าจาก FormData และฟอร์มกรองห้องในหน้าปฏิทิน
 *   เป็น native GET form ที่ navigate ทั้งหน้า — ทั้งสองทางยังทำงานเหมือนเดิมทุกประการ
 *
 * ⚠️ ข้อแลกเปลี่ยนที่ต้องรู้: hidden input ไม่เข้าร่วม constraint validation ของเบราว์เซอร์
 *   `required` ที่นี่จึงเป็นแค่ ARIA ไม่ใช่การบังคับกรอกจริง ต้อง validate ฝั่ง server เสมอ
 *   (ซึ่ง Zod ใน booking.actions.ts ทำอยู่แล้ว)
 */

export interface SelectProps {
  /** ใส่แล้วจะได้ hidden input มาด้วย ทำให้ FormData เก็บค่าไปได้ */
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  /** ผูก hidden input เข้ากับฟอร์มที่อยู่นอก DOM tree เดียวกัน */
  form?: string;
  size?: Size;
  className?: string;
  /** ไอคอนนำหน้าข้อความใน trigger เช่นนาฬิกาของ TimePicker */
  icon?: React.ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

const TYPEAHEAD_RESET_MS = 500;

export function Select({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  required,
  id,
  form,
  size = "md",
  className,
  icon,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const a11y = useFieldControl({
    id,
    required,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  });

  const [current, setCurrent] = useControllableState(value, defaultValue ?? "", onValueChange);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ buffer: "", timer: 0 });

  const uid = useId();
  const listboxId = `${uid}lb`;
  const optionId = (index: number) => `${uid}o${index}`;

  useAnchoredPosition(triggerRef, floatingRef, open, { matchWidth: true, offset: 4 });

  const close = useCallback(() => setOpen(false), []);
  useDismiss({ active: open, onDismiss: close, refs: [rootRef, floatingRef] });

  const selectedIndex = options.findIndex((o) => o.value === current);
  const selectedOption = selectedIndex > -1 ? options[selectedIndex] : undefined;

  /** เลื่อนไปตัวถัดไปที่กดได้ — ไม่วน เหมือน native select */
  const step = useCallback(
    (from: number, direction: 1 | -1) => {
      let next = from;
      for (;;) {
        next += direction;
        if (next < 0 || next >= options.length) return from < 0 ? -1 : from;
        if (!options[next].disabled) return next;
      }
    },
    [options],
  );

  const edge = useCallback(
    (direction: 1 | -1) => {
      const start = direction === 1 ? -1 : options.length;
      return step(start, direction);
    },
    [options.length, step],
  );

  const openMenu = useCallback(
    (startIndex?: number) => {
      if (disabled) return;
      const fallback = selectedIndex > -1 && !options[selectedIndex].disabled ? selectedIndex : edge(1);
      setActiveIndex(startIndex ?? fallback);
      setOpen(true);
    },
    [disabled, edge, options, selectedIndex],
  );

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      setCurrent(option.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [options, setCurrent],
  );

  /** พิมพ์เพื่อกระโดด — รับ space ต่อท้ายด้วย เพราะชื่อห้องภาษาไทยมีเว้นวรรค */
  const runTypeahead = useCallback(
    (char: string) => {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.buffer += char.toLowerCase();
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.buffer = "";
      }, TYPEAHEAD_RESET_MS);

      const buffer = typeahead.current.buffer;
      const match = options.findIndex(
        (o) => !o.disabled && o.label.toLowerCase().startsWith(buffer),
      );
      if (match > -1) {
        if (open) setActiveIndex(match);
        else openMenu(match);
      }
    },
    [open, openMenu, options],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const { key, altKey, ctrlKey, metaKey } = event;

    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        openMenu();
        return;
      }
      if (key === "Home") {
        event.preventDefault();
        openMenu(edge(1));
        return;
      }
      if (key === "End") {
        event.preventDefault();
        openMenu(edge(-1));
        return;
      }
    } else {
      if (key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => step(i, 1));
        return;
      }
      if (key === "ArrowUp") {
        if (altKey) {
          event.preventDefault();
          close();
          return;
        }
        event.preventDefault();
        setActiveIndex((i) => step(i, -1));
        return;
      }
      if (key === "Home") {
        event.preventDefault();
        setActiveIndex(edge(1));
        return;
      }
      if (key === "End") {
        event.preventDefault();
        setActiveIndex(edge(-1));
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        commit(activeIndex);
        return;
      }
      if (key === " " && typeahead.current.buffer === "") {
        event.preventDefault();
        commit(activeIndex);
        return;
      }
      if (key === "Escape") {
        /* useDismiss จัดการปิดให้แล้ว ที่นี่แค่กันไม่ให้ทะลุไปปิด Modal ที่ครอบอยู่ */
        event.preventDefault();
        return;
      }
      if (key === "Tab") {
        /* commit แล้วปล่อยให้โฟกัสไปต่อตามปกติ — ห้าม preventDefault */
        commit(activeIndex);
        return;
      }
    }

    if (key.length === 1 && !ctrlKey && !metaKey && !altKey) {
      event.preventDefault();
      runTypeahead(key);
    }
  }

  /* เลื่อนตัวเลือกที่กำลังชี้อยู่ให้อยู่ในสายตาเสมอ */
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  useEffect(() => {
    const ref = typeahead.current;
    return () => window.clearTimeout(ref.timer);
  }, []);

  return (
    <div ref={rootRef} className={cx("select-root", className)}>
      {name && <input type="hidden" name={name} value={current} form={form} />}

      <button
        ref={triggerRef}
        /* ไม่ใส่ type="button" = กดแล้วฟอร์มถูก submit ทันที */
        type="button"
        id={a11y.id}
        disabled={disabled}
        className={cx("select-trigger", size === "sm" && "btn-sm")}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex > -1 ? optionId(activeIndex) : undefined}
        aria-describedby={a11y["aria-describedby"]}
        aria-invalid={a11y["aria-invalid"]}
        aria-required={a11y.required || undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          /*
           * popover ถูก portal ไป body แล้ว relatedTarget จึงไม่มีวันอยู่ใน rootRef
           * ต้องเช็คกับ floatingRef เท่านั้น — นี่คือบั๊กอันดับหนึ่งของ popover ที่ portal
           */
          if (!floatingRef.current?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className={cx("truncate", !selectedOption && "select-placeholder")}>
          {selectedOption?.label ?? placeholder ?? " "}
          </span>
        </span>
        <ChevronDownIcon className="select-chevron" />
      </button>

      {open &&
        createPortal(
          <div ref={floatingRef} className="popover anchored">
            <ul id={listboxId} role="listbox" tabIndex={-1} aria-labelledby={a11y.id} className="listbox">
              {options.length === 0 && <li className="listbox-empty">ไม่มีตัวเลือก</li>}

              {options.map((option, index) => (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option.value === current}
                  aria-disabled={option.disabled || undefined}
                  data-active={index === activeIndex ? "" : undefined}
                  className="listbox-option"
                  onMouseEnter={() => setActiveIndex(index)}
                  /* กันโฟกัสหลุดจาก trigger ตอนกดเมาส์ — โมเดลนี้โฟกัสอยู่ที่ trigger ตลอด */
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => commit(index)}
                >
                  <span>{option.label}</span>
                  {option.value === current && <CheckIcon className="size-4 shrink-0" />}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
