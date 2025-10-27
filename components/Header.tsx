import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslations } from '../lib/i18n';
import { Language } from '../types';
import { Globe, LogOut } from './lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { trackEvent } from '../lib/analytics';


interface HeaderProps {
  currentDay: number;
  setDay: (day: number) => void;
}

const Header: React.FC<HeaderProps> = ({ currentDay, setDay }) => {
  const { language, setLanguage, user } = useAppContext();
  const t = useTranslations(language);

  const days = [
    { day: 1, label: t('day1') },
    { day: 2, label: t('day2') },
    { day: 3, label: t('day3') },
  ];

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' },
    { code: 'am', name: 'አማርኛ' },
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as Language;
    setLanguage(newLanguage);
    trackEvent('Language Changed', 'Navigation', newLanguage);
  };

  const handleDayChange = (day: number) => {
    setDay(day);
    trackEvent('Day Changed', 'Navigation', `Day ${day}`);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const dayText = ['text-day1', 'text-day2', 'text-day3'];
  const dayBorder = ['border-day1', 'border-day2', 'border-day3'];
  
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-lg md:text-xl font-bold text-foreground whitespace-nowrap">{t('app.title')}</h1>
          
          <nav className="hidden md:flex items-center justify-center flex-grow">
            <div className="flex space-x-8">
              {days.map(({ day, label }) => (
                <button
                  key={day}
                  onClick={() => handleDayChange(day)}
                  className={`border-b-2 pb-1 text-sm font-medium transition-colors ${
                    currentDay === day
                      ? `${dayBorder[day - 1]} ${dayText[day - 1]}`
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-transparent border-none text-foreground focus:ring-0 text-sm"
                    >
                    {languages.map(({ code, name }) => (
                        <option key={code} value={code}>
                        {name}
                        </option>
                    ))}
                </select>
            </div>
            {user && (
                 <button onClick={handleLogout} className="flex items-center space-x-2 text-muted-foreground hover:text-destructive transition-colors">
                    <LogOut className="h-5 w-5"/>
                    <span className="hidden sm:inline text-sm font-medium">{t('auth.logout')}</span>
                 </button>
            )}
          </div>
        </div>
        
        <div className="md:hidden border-t border-border">
            <nav className="flex justify-around py-1">
                {days.map(({ day, label }) => (
                <button
                    key={day}
                    onClick={() => handleDayChange(day)}
                    className={`flex-1 text-center py-2 text-sm font-medium border-b-2 transition-colors ${
                    currentDay === day
                        ? `${dayBorder[day-1]} ${dayText[day-1]}`
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {label}
                </button>
                ))}
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;