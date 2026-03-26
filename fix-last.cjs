const fs = require('fs');
let content = fs.readFileSync('src/features/createSettings.ts', 'utf8');
content = "import type { UITheme } from '../types/uiTypes';\n" + content;
fs.writeFileSync('src/features/createSettings.ts', content);
