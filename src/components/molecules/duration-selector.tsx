
import { Button } from "../atoms/button";
import type { NoteDuration } from "../../types/musicTypes";

export interface DurationSelectorProps {
  selectedDuration?: NoteDuration;
  onSelectDuration?: (duration: NoteDuration) => void;
  disabled?: boolean;
}

export const DurationSelector = function(props: DurationSelectorProps) {
  const durations: NoteDuration[] = ["whole", "half", "quarter", "eighth", "sixteenth"];
  return (
    <div className="duration-selector">
      {durations.map(d => 
        <Button 
          key={d} 
          variant={props.selectedDuration === d ? "primary" : "secondary"} 
          onClick={() => props.onSelectDuration?.(d)}
        >
          {d}
        </Button>
      )}
    </div>
  );
};