interface InputProps {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className = '',
  min,
  max,
  step
}: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block font-pixel text-[10px] mb-2 text-darkgray">
          {label} {required && <span className="text-warning">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`input-pixel w-full ${className}`}
      />
    </div>
  );
}