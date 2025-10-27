
import React, { useState, useMemo } from 'react';
import { AppContextProvider, useAppContext } from './contexts/AppContext';
import Header from './components/Header';
import Day1 from './components/Day1';
import Day2 from './components/Day2';
import Day3 from './components/Day3';
import Auth from './components/Auth';
import UserProfileForm from './components/UserProfileForm';

const AppContent: React.FC = () => {
  const [day, setDay] = useState<number>(1);
  const { user, userProfile, isAuthLoading, isProfileLoading } = useAppContext();

  const dayComponent = useMemo(() => {
    switch (day) {
      case 1:
        return <Day1 />;
      case 2:
        return <Day2 />;
      case 3:
        return <Day3 />;
      default:
        return <Day1 />;
    }
  }, [day]);

  if (isAuthLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }
  
  if (!userProfile) {
    return <UserProfileForm />;
  }

  return (
    <div className={`min-h-screen font-sans antialiased`}>
      <Header currentDay={day} setDay={setDay} />
      <main className="px-4 py-8 md:px-6 md:py-12">
        <div className="max-w-5xl mx-auto">
          {dayComponent}
        </div>
      </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
};

export default App;