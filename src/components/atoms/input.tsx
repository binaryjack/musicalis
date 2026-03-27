

export interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

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