
import { Button } from "../atoms/button";
import type { MusicNote } from "../../types/musicTypes";

export interface NoteSelectorProps {
  selectedNote?: MusicNote | null;
  onSelectNote?: (note: MusicNote | null) => void;
  disabled?: boolean;
}

export const NoteSelector = function(props: NoteSelectorProps) {
  const notes: MusicNote[] = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5"];
  return (
    <div className="note-selector">
      {notes.map(n => 
        <Button 
          key={n} 
          variant={props.selectedNote === n ? "primary" : "secondary"} 
          onClick={() => props.onSelectNote?.(n)}
        >
          {n}
        </Button>
      )}
    </div>
  );
};