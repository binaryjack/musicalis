

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ColorPicker = function(props: ColorPickerProps) {
  return (
    <input
      type="color"
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange?.(e.target.value)}
      className={["color-picker", props.className || ""].join(" ").trim()}
    />
  );
};