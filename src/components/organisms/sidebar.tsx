
export type SidebarProps = any;
export const Sidebar = function(props: SidebarProps) { return (<aside className={["sidebar", props.isOpen ? "open" : ""].join(" ").trim()}>{props.children}</aside>); };