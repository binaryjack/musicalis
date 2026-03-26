
import { Button } from "../atoms/button";

export type NoteSelectorProps = any;

export const NoteSelector = function(props: NoteSelectorProps) { const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]; return (<div className="note-selector">{notes.map(n => <Button key={n} variant={props.value === n ? "primary" : "secondary"} onClick={() => props.onChange(n)}>{n}</Button>)}</div>); };