interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
  headerAction?: React.ReactNode;
}

export default function Card({ children, className = '', title, style, headerAction }: CardProps) {
  return (
    <div className={`card-pixel ${className}`} style={style}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="subheading-pixel mb-0">{title}</h3>}
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}