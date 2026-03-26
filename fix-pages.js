const fs = require('fs');

const p1 = \import React from "react";\nimport { MainLayout } from "../components/templates/main-layout";\nexport const HomePage = function() { return (<MainLayout title="?? Music Scoring Tool"><div>Welcome to Musicalist</div></MainLayout>); };\;
const p2 = \import React from "react";\nimport { EditorLayout } from "../components/templates/editor-layout";\nimport { StaffCanvas } from "../components/organisms/staff-canvas";\nimport { PlaybackBar } from "../components/molecules/playback-bar";\nexport const EditorPage = function() { return (<EditorLayout title="Score Editor" playbackBar={<PlaybackBar isPlaying={false} progress={0} onPlayPause={() => {}} onStop={() => {}} onSeek={() => {}} />}><StaffCanvas /></EditorLayout>); };\;
const p3 = \import React from "react";\nimport { SettingsLayout } from "../components/templates/settings-layout";\nexport const SettingsPage = function() { return (<SettingsLayout title="Settings"><div>Settings Content</div></SettingsLayout>); };\;
const p4 = \export * from './home-page';\nexport * from './editor-page';\nexport * from './settings-page';\;

fs.writeFileSync('src/pages/home-page.tsx', p1);
fs.writeFileSync('src/pages/editor-page.tsx', p2);
fs.writeFileSync('src/pages/settings-page.tsx', p3);
fs.writeFileSync('src/pages/index.ts', p4);
