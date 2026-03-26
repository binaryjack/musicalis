

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export type SelectProps = any;

export const Select = function(props: SelectProps) {
  return (
    <select
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
      className={["select", props.className || ""].join(" ").trim()}
    >
      {props.options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};