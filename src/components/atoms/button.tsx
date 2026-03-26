

export type ButtonProps = any;

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