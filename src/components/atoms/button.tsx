

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Button = function(props: ButtonProps) {
  return (
    <button
      type={props.type || "button"}
      className={["button", `button--${props.variant || "primary"}`, `button--${props.size || "medium"}`, props.className || ""].join(" ").trim()}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};