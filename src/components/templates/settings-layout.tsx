
import { Header } from "../organisms/header";
import { Sidebar } from "../organisms/sidebar";

export type SettingsLayoutProps = any;
export const SettingsLayout = function(props: SettingsLayoutProps) { return (<div className="settings-layout"><Header title={props.title} /><div className="settings-layout__body"><Sidebar>{props.navigation}</Sidebar><main className="settings-layout__content">{props.children}</main></div></div>); };