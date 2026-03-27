
export interface HeaderProps {
  title?: string;
  onHome?: () => void;
  onSettings?: () => void;
  children?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export const Header = function(props: HeaderProps) { return (<header className="header"><h1>{props.title}</h1>{props.children}<div className="header__right">{props.right}</div></header>); };