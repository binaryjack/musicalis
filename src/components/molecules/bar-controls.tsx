
import { Button } from "../atoms/button";
import { Input } from "../atoms/input";
import { Label } from "../atoms/label";

export interface BarControlsProps {
  barNumber?: number;
  totalBars?: number;
  tempo?: number;
  onAddBar?: () => void;
  onRemoveBar?: () => void;
  onDuplicateBar?: () => void;
  onTempoChange?: (tempo: number) => void;
  disabled?: boolean;
}

export const BarControls = function(props: BarControlsProps) { return (<div className="bar-controls"><Button onClick={props.onAddBar}>Add Bar</Button><Button onClick={props.onRemoveBar} variant="danger">Remove Bar</Button><div className="tempo-control"><Label>Tempo</Label><Input type="number" value={props.tempo} onChange={(v: string) => props.onTempoChange && props.onTempoChange(Number(v))} /></div></div>); };