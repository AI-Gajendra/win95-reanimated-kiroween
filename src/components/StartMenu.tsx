/**
 * Start Menu Component
 * 
 * The popup menu that appears when clicking the Start button.
 * Provides access to applications and search functionality.
 */

import React from 'react';
import { useWindowManager } from '../../core/window-manager/WindowContext';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAppLaunch: (appId: string) => void;
  onSearch?: (query: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  onClose,
  onAppLaunch,
  onSearch
}) => {
  const { getRegisteredApps } = useWindowManager();
  const apps = getRegisteredApps();
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!isOpen) return null;

  const handleAppClick = (appId: string) => {
    onAppLaunch(appId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <div
      className="absolute bottom-7 left-0.5 w-64 bg-win95-gray win95-outset shadow-lg"
      style={{
        fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', sans-serif",
      }}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
      role="menu"
      aria-label="Start Menu"
    >
      {/* Start Menu Layout */}
      <div className="flex">
        {/* Sidebar with Windows 95 branding */}
        <div
          className="w-8 bg-win95-dark-gray flex items-end justify-center pb-2"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
        >
          <span className="text-win95-white font-bold text-xl tracking-wider">
            Windows <span className="font-normal">95</span>
          </span>
        </div>

        {/* Main menu content area */}
        <div className="flex-1 flex flex-col">
          {/* Search input field */}
          <div className="p-2 border-b-2 border-win95-dark-gray">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search (AI integration coming soon)..."
              className="
                w-full
                px-2 py-1
                bg-win95-white
                text-win95-black
                text-[11px]
                win95-inset
                focus:outline-none
                focus:outline-1
                focus:outline-dotted
                focus:outline-win95-black
                focus:outline-offset-[-2px]
              "
              aria-label="Search applications"
              role="searchbox"
            />
          </div>

          {/* Application list */}
          <div className="py-1" role="group" aria-label="Applications">
            {apps.length === 0 ? (
              <div className="px-3 py-2 text-win95-black text-[11px]" role="status">
                No applications available
              </div>
            ) : (
              apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id)}
                  className="
                    w-full
                    px-3 py-2
                    flex items-center gap-2
                    text-left
                    text-win95-black text-[11px]
                    hover:bg-win95-navy hover:text-win95-white
                    transition-colors
                    cursor-pointer
                  "
                  role="menuitem"
                  aria-label={`Launch ${app.name}`}
                >
                  <span className="text-base" aria-hidden="true">{app.icon}</span>
                  <span>{app.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
