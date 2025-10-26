import React, { useState, useEffect } from 'react';
import { View } from './types';
import ChatView from './components/ChatView';
import FaceRecognitionView from './components/FaceRecognitionView';
import DataManagementView from './components/DataManagementView';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header currentView={currentView} setCurrentView={setCurrentView} isOnline={isOnline} />
      <main className="flex-grow flex flex-col items-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-4xl h-full flex-grow">
          {currentView === View.CHAT && <ChatView isOnline={isOnline} />}
          {currentView === View.FACE_RECOGNITION && <FaceRecognitionView isOnline={isOnline} />}
          {currentView === View.DATA_MANAGEMENT && <DataManagementView />}
        </div>
      </main>
    </div>
  );
};

export default App;
