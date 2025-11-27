import React from 'react';

interface TitleBarProps {
  title: string;
  icon?: string;
  active?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  showMinimize?: boolean;
  showMaximize?: boolean;
  showClose?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  active = true,
  onMinimize,
  onMaximize,
  onClose,
  showMinimize = true,
  showMaximize = true,
  showClose = true,
}) => {
  const bgColor = active ? 'bg-win95-navy' : 'bg-win95-dark-gray';

  return (
    <div
      className={`
        ${bgColor}
        text-win95-white
        font-win95
        text-[11px]
        h-[24px]
        flex
        items-center
        justify-between
        px-1
        select-none
      `}
    >
      {/* Left side: Icon and Title */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {icon && (
          <img
            src={icon}
            alt=""
            className="w-4 h-4 flex-shrink-0"
          />
        )}
        <span className="truncate font-bold">{title}</span>
      </div>

      {/* Right side: Control Buttons */}
      <div className="flex gap-0.5 flex-shrink-0">
        {showMinimize && (
          <button
            onClick={onMinimize}
            className="
              w-4 h-4
              bg-win95-gray
              win95-outset
              flex
              items-center
              justify-center
              active:win95-pressed
              hover:bg-win95-gray
            "
            aria-label="Minimize"
          >
            <span className="text-win95-black text-[8px] font-bold mb-1">_</span>
          </button>
        )}
        
        {showMaximize && (
          <button
            onClick={onMaximize}
            className="
              w-4 h-4
              bg-win95-gray
              win95-outset
              flex
              items-center
              justify-center
              active:win95-pressed
              hover:bg-win95-gray
            "
            aria-label="Maximize"
          >
            <span className="text-win95-black text-[10px] font-bold">□</span>
          </button>
        )}
        
        {showClose && (
          <button
            onClick={onClose}
            className="
              w-4 h-4
              bg-win95-gray
              win95-outset
              flex
              items-center
              justify-center
              active:win95-pressed
              hover:bg-win95-gray
            "
            aria-label="Close"
          >
            <span className="text-win95-black text-[10px] font-bold">×</span>
          </button>
        )}
      </div>
    </div>
  );
};
