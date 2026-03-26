
export type HeaderProps = any;
export const Header = function(props: HeaderProps) { return (<header className="header"><h1>{props.title}</h1>{props.children}<div className="header__right">{props.right}</div></header>); };