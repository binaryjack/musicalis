const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace('import React, { useState } from "react";', 'import { useState } from "react";');
app = app.replace('<EditorPage />', '<EditorPage projectId="123" />');
fs.writeFileSync('src/App.tsx', app);

let features = ['src/features/createEditor.ts', 'src/features/createProjects.ts', 'src/features/createSettings.ts'];
for (const file of features) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const create[A-Za-z]+ = function\(/, function(match) { return match + 'this: any, '; });
  fs.writeFileSync(file, content);
}

let settingsTypes = fs.readFileSync('src/types/settingsTypes.ts', 'utf8');
settingsTypes = settingsTypes.replace(/import type \{ UITheme \} from '.\/uiTypes';\r?\n/, '');
fs.writeFileSync('src/types/settingsTypes.ts', settingsTypes);

let createSettings = fs.readFileSync('src/features/createSettings.ts', 'utf8');
createSettings = createSettings.replace('type { SettingsState, UITheme, AudioSettings, ExportSettings }', 'type { SettingsState, AudioSettings, ExportSettings }');
fs.writeFileSync('src/features/createSettings.ts', createSettings);
