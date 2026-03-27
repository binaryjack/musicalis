
import { ColorPicker } from "../atoms/color-picker";
import { Label } from "../atoms/label";

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
}

export interface ColorPreviewProps {
  colors?: ColorItem[];
  selectedColorId?: string;
  color?: string;
  label?: string;
  onChange?: (color: string) => void;
  onSelectColor?: (colorId: string) => void;
  onAddColor?: () => void;
  onRemoveColor?: (colorId: string) => void;
}

export const ColorPreview = function(props: ColorPreviewProps) { return (<div className="color-preview"><Label>{props.label}</Label><ColorPicker value={props.color} disabled={!props.onChange} onChange={props.onChange || (() => {})} /></div>); };