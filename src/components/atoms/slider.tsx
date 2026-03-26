

export type SliderProps = any;

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
};