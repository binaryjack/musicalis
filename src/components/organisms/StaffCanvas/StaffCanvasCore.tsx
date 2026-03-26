import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../../types';
import type { MusicNote, NoteDuration } from '../../../types/enums';
import styles from './StaffCanvas.module.css';

// OpenSheetMusicDisplay will be integrated here
interface OpenSheetMusicDisplay {
  render(): Promise<void>;
  setOptions(options: Record<string, unknown>): void;
  load(musicXml: string): Promise<void>;
  cursor: Record<string, unknown>;
}

export interface StaffCanvasCoreProps {
  project: Project;
  selectedNote: MusicNote | null;
  selectedDuration: NoteDuration;
  velocity: number;
  onNoteClick?: (note: MusicNote, barIndex: number, position: number) => void;
  onNoteAdd?: (note: MusicNote, barIndex: number, position: number) => void;
  onNoteRemove?: (barIndex: number, noteIndex: number) => void;
  onNoteEdit?: (barIndex: number, noteIndex: number, updates: Partial<any>) => void;
}

export const StaffCanvasCore = ({
  project,
  selectedNote,
  selectedDuration,
  velocity: _velocity,
  onNoteClick,
  onNoteAdd,
  onNoteRemove: _onNoteRemove,
  onNoteEdit: _onNoteEdit,
}: StaffCanvasCoreProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize OpenSheetMusicDisplay
  useEffect(() => {
    let mounted = true;
    
    const initializeOSMD = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!canvasRef.current) return;

        // For now, we'll create a placeholder until OSMD is properly integrated
        // const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
        
        // osmdRef.current = new OpenSheetMusicDisplay(canvasRef.current, {
        //   backend: 'svg',
        //   drawTitle: false,
        //   drawCredits: false,
        //   drawPartNames: false,
        //   drawMeasureNumbers: true,
        //   coloringMode: 2,
        // });

        // Generate MusicXML from project data
        // const musicXml = generateMusicXML(project);
        
        // For now, show a placeholder
        if (canvasRef.current && mounted) {
          canvasRef.current.innerHTML = `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 300px;
              background: #f8f9fa;
              border: 2px dashed #dee2e6;
              border-radius: 8px;
              color: #6c757d;
              font-size: 16px;
            ">
              <div style="margin-bottom: 16px; font-size: 24px;">🎼</div>
              <div>Staff Canvas - OpenSheetMusicDisplay Integration</div>
              <div style="font-size: 14px; margin-top: 8px;">
                Project: ${project.name} | Notes: ${getTotalNoteCount(project)}
              </div>
              <div style="font-size: 12px; margin-top: 16px; color: #868e96;">
                Selected: ${selectedNote ? `${selectedNote} (${selectedDuration})` : 'None'}
              </div>
            </div>
          `;
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize staff canvas');
          setIsLoading(false);
        }
      }
    };

    initializeOSMD();

    return () => {
      mounted = false;
      if (osmdRef.current) {
        // Cleanup OSMD instance
        osmdRef.current = null;
      }
    };
  }, [project, selectedNote, selectedDuration]);

  // Handle canvas clicks for note placement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onNoteClick) return;

    const handleClick = (event: MouseEvent) => {
      // Calculate click position and map to musical position
      // This would integrate with OSMD's coordinate system
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      // const y = event.clientY - rect.top;
      
      // For now, placeholder logic
      const barIndex = Math.floor(x / 200); // Rough estimation
      const position = (x % 200) / 200; // Position within bar
      
      if (selectedNote && onNoteAdd) {
        onNoteAdd(selectedNote, barIndex, position);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [selectedNote, onNoteClick, onNoteAdd]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        Loading staff notation...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Error: {error}
      </div>
    );
  }

  return <div ref={canvasRef} style={{ height: '100%', width: '100%' }} />;
};

// Helper function to count total notes in project
function getTotalNoteCount(project: Project): number {
  return project.pianoStaves.reduce((total: number) => {
    // For now, return placeholder count since PianoStaff structure is not fully defined
    return total + 0;
  }, 0);
}