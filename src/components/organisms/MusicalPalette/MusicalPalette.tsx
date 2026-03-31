import { useState } from 'react';
import { MusicNote, NoteDuration, MusicalElementType } from '../../../types';
import styles from './MusicalPalette.module.css';

export interface MusicalTool {
  id: string;
  type: MusicalElementType;
  name: string;
  icon: string;
  pitch?: MusicNote;
  duration: NoteDuration;
  description: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  tools: MusicalTool[];
  defaultTool: string; // ID of the default tool for this category
}

export interface MusicalPaletteProps {
  selectedTool: MusicalTool | null;
  onSelectTool: (tool: MusicalTool) => void;
  disabled?: boolean;
}

// Define tools in proper duration order (whole -> half -> quarter -> eighth -> sixteenth)
const NOTE_TOOLS: MusicalTool[] = [
  {
    id: 'whole-note',
    type: MusicalElementType.NOTE,
    name: 'Whole Note',
    icon: '𝅝', // Proper whole note symbol
    duration: 'whole' as NoteDuration,
    description: 'Click staff to add whole notes (4 beats)'
  },
  {
    id: 'half-note',
    type: MusicalElementType.NOTE,
    name: 'Half Note',
    icon: '𝅗𝅥', // Proper half note symbol
    duration: 'half' as NoteDuration,
    description: 'Click staff to add half notes (2 beats)'
  },
  {
    id: 'quarter-note',
    type: MusicalElementType.NOTE,
    name: 'Quarter Note',
    icon: '♩',
    duration: 'quarter' as NoteDuration,
    description: 'Click staff to add quarter notes (1 beat)'
  },
  {
    id: 'eighth-note',
    type: MusicalElementType.NOTE,
    name: 'Eighth Note',
    icon: '♪',
    duration: 'eighth' as NoteDuration,
    description: 'Click staff to add eighth notes (1/2 beat)'
  },
  {
    id: 'sixteenth-note',
    type: MusicalElementType.NOTE,
    name: 'Sixteenth Note',
    icon: '𝅘𝅥𝅯',
    duration: 'sixteenth' as NoteDuration,
    description: 'Click staff to add sixteenth notes (1/4 beat)'
  }
];

const REST_TOOLS: MusicalTool[] = [
  {
    id: 'whole-rest',
    type: MusicalElementType.REST,
    name: 'Whole Rest',
    icon: '𝄻',
    duration: 'whole' as NoteDuration,
    description: 'Click staff to add whole rests (4 beats silence)'
  },
  {
    id: 'half-rest',
    type: MusicalElementType.REST,
    name: 'Half Rest',
    icon: '𝄼',
    duration: 'half' as NoteDuration,
    description: 'Click staff to add half rests (2 beats silence)'
  },
  {
    id: 'quarter-rest',
    type: MusicalElementType.REST,
    name: 'Quarter Rest',
    icon: '𝄽',
    duration: 'quarter' as NoteDuration,
    description: 'Click staff to add quarter rests (1 beat silence)'
  },
  {
    id: 'eighth-rest',
    type: MusicalElementType.REST,
    name: 'Eighth Rest',
    icon: '𝄾',
    duration: 'eighth' as NoteDuration,
    description: 'Click staff to add eighth rests (1/2 beat silence)'
  },
  {
    id: 'sixteenth-rest',
    type: MusicalElementType.REST,
    name: 'Sixteenth Rest',
    icon: '𝄿',
    duration: 'sixteenth' as NoteDuration,
    description: 'Click staff to add sixteenth rests (1/4 beat silence)'
  }
];

// Category definitions with Illustrator-style organization
const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'notes',
    name: 'Notes',
    icon: '♩', // Category icon - shows selected tool icon when collapsed
    tools: NOTE_TOOLS,
    defaultTool: 'quarter-note'
  },
  {
    id: 'rests',
    name: 'Rests', 
    icon: '𝄽', // Category icon - shows selected tool icon when collapsed
    tools: REST_TOOLS,
    defaultTool: 'quarter-rest'
  }
];

// Flattened tool array for easy lookup
const ALL_TOOLS: MusicalTool[] = [...NOTE_TOOLS, ...REST_TOOLS];

export const MusicalPalette = ({ selectedTool, onSelectTool, disabled = false }: MusicalPaletteProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedByCategory, setSelectedByCategory] = useState<{ [categoryId: string]: string }>({
    notes: 'quarter-note',
    rests: 'quarter-rest'
  });

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      // Collapse the category
      setExpandedCategory(null);
    } else {
      // Expand the category
      setExpandedCategory(categoryId);
    }
  };

  const handleToolSelect = (tool: MusicalTool) => {
    if (!disabled) {
      // Update the selected tool for this category
      const category = TOOL_CATEGORIES.find(cat => 
        cat.tools.some(t => t.id === tool.id)
      );
      
      if (category) {
        setSelectedByCategory(prev => ({
          ...prev,
          [category.id]: tool.id
        }));
      }
      
      // Collapse the category after selection (Illustrator-style)
      setExpandedCategory(null);
      
      // Notify parent
      onSelectTool(tool);
    }
  };

  const getToolById = (toolId: string): MusicalTool | undefined => {
    return ALL_TOOLS.find(tool => tool.id === toolId);
  };

  const getCategoryDisplayTool = (category: ToolCategory): MusicalTool => {
    const selectedId = selectedByCategory[category.id];
    const tool = getToolById(selectedId);
    return tool || getToolById(category.defaultTool) || category.tools[0];
  };

  return (
    <div className={styles.palette}>
      <div className={styles.categoryList}>
        {TOOL_CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const displayTool = getCategoryDisplayTool(category);
          const isSelected = selectedTool?.id === displayTool.id;

          return (
            <div key={category.id} className={styles.categoryGroup}>
              {/* Category Header - shows selected tool from this category */}
              <button
                className={`${styles.categoryHeader} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleCategoryClick(category.id)}
                disabled={disabled}
                title={`${category.name} - Click to expand/collapse`}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryTitle}>{category.name}</span>
                <span className={styles.expandIcon}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Expanded Tools */}
              {isExpanded && (
                <div className={styles.toolSubmenu}>
                  {category.tools.map((tool) => {
                    const isToolSelected = selectedTool?.id === tool.id;
                    return (
                      <button
                        key={tool.id}
                        className={`${styles.subTool} ${isToolSelected ? styles.selected : ''}`}
                        onClick={() => handleToolSelect(tool)}
                        disabled={disabled}
                        data-type={tool.type}
                        title={tool.description}
                      >
                        <span className={styles.subToolIcon}>{tool.icon}</span>
                        <span className={styles.subToolName}>{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Export the tools for use in other components
export { ALL_TOOLS, NOTE_TOOLS, REST_TOOLS, TOOL_CATEGORIES };