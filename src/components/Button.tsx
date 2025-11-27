import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  disabled = false,
  ...props
}) => {
  const sizeClasses = {
    small: 'px-2 py-0.5 text-[10px] min-w-[60px]',
    medium: 'px-4 py-1 text-[11px] min-w-[75px]',
    large: 'px-6 py-2 text-[12px] min-w-[90px]',
  };

  return (
    <button
      className={`
        bg-win95-gray
        font-win95
        text-win95-black
        win95-outset
        active:win95-pressed
        active:translate-x-[1px]
        active:translate-y-[1px]
        disabled:text-win95-dark-gray
        disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
