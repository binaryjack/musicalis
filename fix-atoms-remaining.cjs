const fs = require("fs");

fs.writeFileSync("src/components/atoms/slider.tsx", `import React from "react";

export type SliderProps = {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly disabled?: boolean;
  readonly showValue?: boolean;
  readonly onChange: (value: number) => void;
  readonly className?: string;
};

export const Slider = function(props: SliderProps) {
  return (
    <div className={["slider", props.disabled ? "disabled" : "", props.className || ""].join(" ").trim()}>
      <div className="slider__track">
        <input
          type="range"
          className="slider__input"
          min={props.min}
          max={props.max}
          step={props.step || 1}
          value={props.value}
          disabled={props.disabled}
          onChange={(e) => props.onChange(parseFloat(e.target.value))}
        />
      </div>
      {props.showValue && <span className="slider__value">{props.value}</span>}
    </div>
  );
};`);

fs.writeFileSync("src/components/atoms/label.tsx", `import React from "react";

export type LabelProps = {
  readonly htmlFor?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
};

export const Label = function(props: LabelProps) {
  return (
    <label htmlFor={props.htmlFor} className={["label", props.className || ""].join(" ").trim()}>
      {props.children}
    </label>
  );
};`);

fs.writeFileSync("src/components/atoms/select.tsx", `import React from "react";

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export type SelectProps = {
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
  readonly className?: string;
};

export const Select = function(props: SelectProps) {
  return (
    <select
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
      className={["select", props.className || ""].join(" ").trim()}
    >
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};`);

fs.writeFileSync("src/components/atoms/color-picker.tsx", `import React from "react";

export type ColorPickerProps = {
  readonly value: string;
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
  readonly className?: string;
};

export const ColorPicker = function(props: ColorPickerProps) {
  return (
    <input
      type="color"
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
      className={["color-picker", props.className || ""].join(" ").trim()}
    />
  );
};`);

fs.writeFileSync("src/components/atoms/index.ts", `export * from "./button";
export * from "./color-picker";
export * from "./input";
export * from "./label";
export * from "./select";
export * from "./slider";`);

console.log("Remaining Atoms fixed");
