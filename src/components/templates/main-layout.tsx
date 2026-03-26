
import { Header } from "../organisms/header";

export type MainLayoutProps = any;
export const MainLayout = function(props: MainLayoutProps) { return (<div className="main-layout"><Header title={props.title} right={props.headerRight} /><main className="main-layout__content">{props.children}</main></div>); };