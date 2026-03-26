
import { ColorPicker } from "../atoms/color-picker";
import { Label } from "../atoms/label";

export type ColorPreviewProps = any;

export const ColorPreview = function(props: ColorPreviewProps) { return (<div className="color-preview"><Label>{props.label}</Label><ColorPicker value={props.color} disabled={!props.onChange} onChange={props.onChange || (() => {})} /></div>); };