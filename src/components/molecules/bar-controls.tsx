
import { Button } from "../atoms/button";
import { Input } from "../atoms/input";
import { Label } from "../atoms/label";

export type BarControlsProps = any;

export const BarControls = function(props: BarControlsProps) { return (<div className="bar-controls"><Button onClick={props.onAddBar}>Add Bar</Button><Button onClick={props.onRemoveBar} variant="danger">Remove Bar</Button><div className="tempo-control"><Label>Tempo</Label><Input type="number" value={props.tempo} onChange={(v: any) => props.onTempoChange && props.onTempoChange(Number(v))} /></div></div>); };