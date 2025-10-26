import React from 'react';
import { View } from '../types';
import { BotIcon, UserIcon, DatabaseIcon } from './Icons';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOnline: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, isOnline }) => {
  const baseButtonClasses = 'px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const activeButtonClasses = 'bg-blue-600 text-white';
  const inactiveButtonClasses = 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:hover:bg-gray-700';

  return (
    <header className="bg-gray-800 shadow-lg p-4 flex flex-col sm:flex-row justify-between items-center w-full sticky top-0 z-10">
      <div className="flex items-center mb-4 sm:mb-0">
        <BotIcon className="w-8 h-8 mr-3 text-blue-400" />
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
          School Assistant Bot
        </h1>
      </div>
      <nav className="flex space-x-2">
        <button
          onClick={() => setCurrentView(View.CHAT)}
          className={`${baseButtonClasses} ${currentView === View.CHAT ? activeButtonClasses : inactiveButtonClasses}`}
          disabled={!isOnline}
          title={!isOnline ? "This feature requires an internet connection" : ""}
        >
          <span className="flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 00-1-1H5a1 1 0 00-1 1v5a1 1 0 001 1h10a1 1 0 001-1V6zM8 16a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            </svg>
            Conversation
          </span>
        </button>
        <button
          onClick={() => setCurrentView(View.FACE_RECOGNITION)}
          className={`${baseButtonClasses} ${currentView === View.FACE_RECOGNITION ? activeButtonClasses : inactiveButtonClasses}`}
          disabled={!isOnline}
          title={!isOnline ? "This feature requires an internet connection" : ""}
        >
          <span className="flex items-center">
            <UserIcon className="h-5 w-5 mr-2"/>
            Face Analysis
          </span>
        </button>
        <button
          onClick={() => setCurrentView(View.DATA_MANAGEMENT)}
          className={`${baseButtonClasses} ${currentView === View.DATA_MANAGEMENT ? activeButtonClasses : inactiveButtonClasses}`}
        >
          <span className="flex items-center">
            <DatabaseIcon/>
            Manage Data
          </span>
        </button>
      </nav>
    </header>
  );
};

export default Header;
