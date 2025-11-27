import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  variant?: 'outset' | 'inset' | 'flat';
  className?: string;
  padding?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  variant = 'outset',
  className = '',
  padding = true,
}) => {
  const borderClasses = {
    outset: 'win95-outset',
    inset: 'win95-inset',
    flat: 'border-2 border-win95-dark-gray',
  };

  const paddingClass = padding ? 'p-2' : '';

  return (
    <div
      className={`
        bg-win95-gray
        ${borderClasses[variant]}
        ${paddingClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
