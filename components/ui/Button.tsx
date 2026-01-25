interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  const variantClass = variant === 'secondary' 
    ? 'btn-pixel-secondary' 
    : variant === 'success'
    ? 'btn-pixel-success'
    : 'btn-pixel';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}