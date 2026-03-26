const fs = require("fs");
const content = `import React from "react";

export type InputProps = {
  readonly type?: "text" | "number" | "email" | "password";
  readonly value?: string | number;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly onChange?: (value: string) => void;
  readonly className?: string;
};

export const Input = function(props: InputProps) {
  return (
    <input
      type={props.type || "text"}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      className={["input", props.className || ""].join(" ").trim()}
      onChange={(e) => props.onChange && props.onChange(e.target.value)}
    />
  );
};`;
fs.writeFileSync("src/components/atoms/input.tsx", content);
console.log("Input fixed");
