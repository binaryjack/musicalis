
import { Header } from "../organisms/header";
import { Sidebar } from "../organisms/sidebar";

export type EditorLayoutProps = any;
export const EditorLayout = function(props: EditorLayoutProps) { return (<div className="editor-layout"><Header title={props.title} right={props.headerRight} /><div className="editor-layout__body"><Sidebar><div className="sidebar-top">{props.sidebarTop}</div><div className="sidebar-bottom">{props.sidebarBottom}</div></Sidebar><main className="editor-layout__main">{props.children}{props.playbackBar && <div className="editor-layout__footer">{props.playbackBar}</div>}</main></div></div>); };