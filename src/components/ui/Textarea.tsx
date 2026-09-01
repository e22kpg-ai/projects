"use client";

import { cx } from "./cx";
import { useFieldControl } from "./field-context";

export interface TextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  className?: string;
}

export function Textarea({
  className,
  id,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: TextareaProps) {
  const a11y = useFieldControl({
    id,
    required,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid === true || ariaInvalid === "true",
  });

  return <textarea {...rest} {...a11y} className={cx("textarea", className)} />;
}
