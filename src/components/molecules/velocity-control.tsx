
import { Slider } from "../atoms/slider";
import { Label } from "../atoms/label";

export interface VelocityControlProps {
  velocity?: number;
  onVelocityChange?: (velocity: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
}

export const VelocityControl = function(props: VelocityControlProps) { return (<div className="velocity-control"><Label>Velocity</Label><Slider value={props.value || props.velocity} min={props.min || 0} max={props.max || 127} onChange={props.onChange || props.onVelocityChange} showValue /></div>); };