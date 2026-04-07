import { useState, useEffect, useMemo, useRef } from 'react'
import { ToolboxButton } from './toolbox-button'

interface Option { value: string; label: string; icon: string }

interface ToolCategorySelectorProps {
  label: string;
  options: Option[];
  value: string;
  active: boolean;
  onChange: (val: string) => void;
}

export const ToolCategorySelector = function({ label, options, value, active, onChange }: ToolCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find(o => o.value === value);
  const lastSelected = useMemo(() => options[2] || options[0], [options]);
  const displayOption = currentOption || lastSelected;

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: isOpen ? 10 : 1 }}>
      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '-4px' }}>{label}</div>
      <ToolboxButton
        active={active}
        onClick={() => active ? setIsOpen(o => !o) : onChange(displayOption.value)}
        onContextMenu={(e) => { e.preventDefault(); setIsOpen(true); }}
        icon={displayOption.icon}
        label={`${displayOption.label} (Click active or right-click for more)`}
      >
        <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 6px 6px', borderColor: 'transparent transparent #888 transparent' }} />
      </ToolboxButton>

      {isOpen && (
        <div style={{
          position: 'absolute', left: '100%', top: '16px', marginLeft: '8px',
          backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px',
          display: 'flex', flexDirection: 'row', padding: '4px', gap: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => (
            <ToolboxButton key={opt.value} active={opt.value === value && active} onClick={() => { onChange(opt.value); setIsOpen(false); }} icon={opt.icon} label={opt.label} />
          ))}
        </div>
      )}
    </div>
  );
};
