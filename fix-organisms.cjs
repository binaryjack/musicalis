const fs = require('fs');

const o1 = \import React from 'react';\nexport type HeaderProps = { title: string; children?: React.ReactNode; right?: React.ReactNode; };\nexport const Header = function(props: HeaderProps) { return (<header className="header"><h1>{props.title}</h1>{props.children}<div className="header__right">{props.right}</div></header>); };\;

const o2 = \import React from 'react';\nexport type ToolbarProps = { children: React.ReactNode; };\nexport const Toolbar = function(props: ToolbarProps) { return (<div className="toolbar">{props.children}</div>); };\;

const o3 = \import React from 'react';\nexport type SidebarProps = { children: React.ReactNode; isOpen?: boolean; };\nexport const Sidebar = function(props: SidebarProps) { return (<aside className={['sidebar', props.isOpen ? 'open' : ''].join(' ').trim()}>{props.children}</aside>); };\;

const o4 = \import React from 'react';\nexport type NavigationProps = { links: readonly { label: string; href: string; }[]; };\nexport const Navigation = function(props: NavigationProps) { return (<nav className="navigation"><ul>{props.links.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul></nav>); };\;

const o5 = \import React from 'react';\nexport type ModalProps = { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; };\nexport const Modal = function(props: ModalProps) { if (!props.isOpen) return null; return (<div className="modal-overlay" onClick={props.onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal__header"><h2>{props.title}</h2><button onClick={props.onClose}>Close</button></div><div className="modal__content">{props.children}</div></div></div>); };\;

const o6 = \import React from 'react';\nexport type StaffCanvasProps = { width?: number; height?: number; };\nexport const StaffCanvas = function(props: StaffCanvasProps) { return (<div className="staff-canvas" style={{ width: props.width || '100%', height: props.height || 400, border: '1px solid #ccc' }}>Staff Canvas Placeholder</div>); };\;

const o7 = \export * from './header';\nexport * from './toolbar';\nexport * from './sidebar';\nexport * from './navigation';\nexport * from './modal';\nexport * from './staff-canvas';\;

fs.writeFileSync('src/components/organisms/header.tsx', o1);
fs.writeFileSync('src/components/organisms/toolbar.tsx', o2);
fs.writeFileSync('src/components/organisms/sidebar.tsx', o3);
fs.writeFileSync('src/components/organisms/navigation.tsx', o4);
fs.writeFileSync('src/components/organisms/modal.tsx', o5);
fs.writeFileSync('src/components/organisms/staff-canvas.tsx', o6);
fs.writeFileSync('src/components/organisms/index.ts', o7);
