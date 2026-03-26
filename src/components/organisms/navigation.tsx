
export type NavigationProps = { links: readonly { label: string; href: string; }[]; };
export const Navigation = function(props: NavigationProps) { return (<nav className="navigation"><ul>{props.links.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul></nav>); };