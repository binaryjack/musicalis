

export interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}

export const Label = function(props: LabelProps) {
  return (
    <label htmlFor={props.htmlFor} className={["label", props.className || ""].join(" ").trim()}>
      {props.children}
    </label>
  );
};