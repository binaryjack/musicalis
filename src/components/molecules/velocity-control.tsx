
import { Slider } from "../atoms/slider";
import { Label } from "../atoms/label";

export type VelocityControlProps = any;

export const VelocityControl = function(props: VelocityControlProps) { return (<div className="velocity-control"><Label>Velocity</Label><Slider value={props.value} min={0} max={127} onChange={props.onChange} showValue /></div>); };