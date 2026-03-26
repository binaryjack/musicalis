const fs = require('fs');

let button = fs.readFileSync('src/components/atoms/button.tsx', 'utf8');
button = button.replace(/import type \{ ButtonVariant, ButtonSize \} from "\.\.\/\.\.\/types\/uiTypes\";\r?\n/, '');
fs.writeFileSync('src/components/atoms/button.tsx', button);

let select = fs.readFileSync('src/components/atoms/select.tsx', 'utf8');
select = select.replace(/\(option\)/g, '(option: any)');
fs.writeFileSync('src/components/atoms/select.tsx', select);

let barControls = fs.readFileSync('src/components/molecules/bar-controls.tsx', 'utf8');
barControls = barControls.replace(/\(v\) =>/g, '(v: any) =>');
fs.writeFileSync('src/components/molecules/bar-controls.tsx', barControls);

let settingsTypes = fs.readFileSync('src/types/settingsTypes.ts', 'utf8');
if (!settingsTypes.includes('import type { UITheme }')) {
  settingsTypes = "import type { UITheme } from './uiTypes';\n" + settingsTypes;
}
fs.writeFileSync('src/types/settingsTypes.ts', settingsTypes);

let uiTypes = fs.readFileSync('src/types/uiTypes.ts', 'utf8');
if (!uiTypes.includes('UITheme')) {
  uiTypes += '\nexport type UITheme = "dark" | "light" | "system";\n';
}
fs.writeFileSync('src/types/uiTypes.ts', uiTypes);

let createSettings = fs.readFileSync('src/features/createSettings.ts', 'utf8');
if (!createSettings.includes('UITheme')) {
  createSettings = createSettings.replace('type { SettingsState, AudioSettings, ExportSettings }', 'type { SettingsState, UITheme, AudioSettings, ExportSettings }');
  fs.writeFileSync('src/features/createSettings.ts', createSettings);
}
