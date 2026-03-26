const fs = require("fs");

const content = `import React from "react";
import type { ButtonVariant, ButtonSize } from "../../types/uiTypes";

export type ButtonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly className?: string;
  readonly type?: "button" | "submit" | "reset";
};

export const Button = function(props: ButtonProps) {
  return (
    <button
      type={props.type || "button"}
      className={["button", \`button--\${props.variant || "primary"}\`, \`button--\${props.size || "medium"}\`, props.className || ""].join(" ").trim()}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};`;
fs.writeFileSync("src/components/atoms/button.tsx", content);
console.log("Button fixed");
