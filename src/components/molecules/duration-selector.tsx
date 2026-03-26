
import { Button } from "../atoms/button";

export type DurationSelectorProps = any;

export const DurationSelector = function(props: DurationSelectorProps) { const durations = ["Whole", "Half", "Quarter", "Eighth", "16th"]; return (<div className="duration-selector">{durations.map(d => <Button key={d} variant={props.value === d ? "primary" : "secondary"} onClick={() => props.onChange(d)}>{d}</Button>)}</div>); };