

export type InputProps = any;

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
};