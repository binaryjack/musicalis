const fs = require('fs');

function fixImports(file, newName) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // replace generic casing imports
  content = content.replace(/import \{ Button \} from '\.\.\/components\/atoms\/Button\/Button';/g, "import { Button } from '../components/atoms/button';");
  content = content.replace(/import \{ MainLayout \} from '\.\.\/components\/templates\/MainLayout\/MainLayout';/g, "import { MainLayout } from '../components/templates/main-layout';");
  content = content.replace(/import \{ EditorLayout \} from '\.\.\/components\/templates\/EditorLayout\/EditorLayout';/g, "import { EditorLayout } from '../components/templates/editor-layout';");
  content = content.replace(/import \{ SettingsLayout \} from '\.\.\/components\/templates\/SettingsLayout\/SettingsLayout';/g, "import { SettingsLayout } from '../components/templates/settings-layout';");
  
  content = content.replace(/import \{ Toolbar \} from '\.\.\/components\/organisms\/Toolbar\/Toolbar';/g, "import { Toolbar } from '../components/organisms/toolbar';");
  content = content.replace(/import \{ NoteSelector \} from '\.\.\/components\/molecules\/NoteSelector\/NoteSelector';/g, "import { NoteSelector } from '../components/molecules/note-selector';");
  content = content.replace(/import \{ DurationSelector \} from '\.\.\/components\/molecules\/DurationSelector\/DurationSelector';/g, "import { DurationSelector } from '../components/molecules/duration-selector';");
  content = content.replace(/import \{ VelocityControl \} from '\.\.\/components\/molecules\/VelocityControl\/VelocityControl';/g, "import { VelocityControl } from '../components/molecules/velocity-control';");
  content = content.replace(/import \{ BarControls \} from '\.\.\/components\/molecules\/BarControls\/BarControls';/g, "import { BarControls } from '../components/molecules/bar-controls';");
  content = content.replace(/import \{ PlaybackBar \} from '\.\.\/components\/molecules\/PlaybackBar\/PlaybackBar';/g, "import { PlaybackBar } from '../components/molecules/playback-bar';");
  content = content.replace(/import \{ ColorPreview \} from '\.\.\/components\/molecules\/ColorPreview\/ColorPreview';/g, "import { ColorPreview } from '../components/molecules/color-preview';");
  content = content.replace(/import \{ StaffCanvas \} from '\.\.\/components\/organisms\/StaffCanvas\/StaffCanvas';/g, "import { StaffCanvas } from '../components/organisms/staff-canvas';");
  content = content.replace(/import \{ Header \} from '\.\.\/components\/organisms\/Header\/Header';/g, "import { Header } from '../components/organisms/header';");

  fs.writeFileSync(newName ? 'src/pages/'+newName : file, content);
  console.log('Fixed imports for', file);
}

fixImports('src/pages/HomePage.tsx', 'home-page.tsx');
fixImports('src/pages/EditorPage.tsx', 'editor-page.tsx');
fixImports('src/pages/SettingsPage.tsx', 'settings-page.tsx');

// fix index.ts
fs.writeFileSync('src/pages/index.ts', `export * from './home-page';\nexport * from './editor-page';\nexport * from './settings-page';\n`);
