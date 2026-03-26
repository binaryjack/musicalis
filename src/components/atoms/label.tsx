

export type LabelProps = any;

export const Label = function(props: LabelProps) {
  return (
    <label htmlFor={props.htmlFor} className={["label", props.className || ""].join(" ").trim()}>
      {props.children}
    </label>
  );
};