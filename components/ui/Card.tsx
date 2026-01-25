interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, className = '', title, style }: CardProps) {
  return (
    <div className={`card-pixel ${className}`} style={style}>
      {title && <h3 className="subheading-pixel">{title}</h3>}
      {children}
    </div>
  );
}