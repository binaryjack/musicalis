const fs = require('fs');
let c = fs.readFileSync('d:/Sources/musicalist/src/pages/editor-page-clean.tsx', 'utf8');

const t1 = '<AddStaffButton onClick={handleAddStaff} />';
const replace1 = \
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px', marginRight: '16px' }}>
            <span style={{ fontSize: '12px' }}>Zoom {Math.round(zoom * 100)}%</span>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))} 
              style={{ width: '80px' }}
            />
          </div>
          <AddStaffButton onClick={handleAddStaff} />\;

c = c.replace(t1, replace1);

const t2 = 'selectedTool={{';
const replace2 = \zoom={zoom}
                selectedTool={{\;

c = c.replace(t2, replace2);

fs.writeFileSync('d:/Sources/musicalist/src/pages/editor-page-clean.tsx', c);
