

export type ColorPickerProps = any;

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
};