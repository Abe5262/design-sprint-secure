
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslations } from '../lib/i18n';
import UserTestingGuide from './day2/UserTestingGuide';
import FeedbackAnalysis from './day2/FeedbackAnalysis';
import SaveStatus from './SaveStatus';
import { Clipboard, MessageSquare, Home, RefreshCw } from 'lucide-react';

const Day2: React.FC = () => {
  const { language } = useAppContext();
  const t = useTranslations(language);
  const [activeTab, setActiveTab] = useState('guide');

  const tabs = [
    { id: 'guide', label: t('day2.step1.title'), icon: Clipboard },
    { id: 'feedback', label: t('day2.step2.title'), icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-4xl font-extrabold text-foreground">{t('day2.title')}</h1>
        <div className="flex items-center space-x-2">
            <SaveStatus />
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-card border border-border rounded-md text-sm text-foreground hover:bg-accent transition">
                <Home className="w-4 h-4" />
                <span>{t('home')}</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-card border border-border rounded-md text-sm text-foreground hover:bg-accent transition">
                <RefreshCw className="w-4 h-4" />
                <span>{t('start.over')}</span>
            </button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className="relative p-1 bg-secondary rounded-full flex items-center">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative z-10 flex-1 px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 focus:outline-none"
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-secondary-foreground'}>{tab.label}</span>
            </button>
          ))}
          <div
            className="absolute top-1 bottom-1 bg-day2 rounded-full shadow-md transition-all duration-300"
            style={{
              width: `calc(50% - 4px)`,
              left: activeTab === 'guide' ? '4px' : 'calc(50% + 4px)',
            }}
          ></div>
        </div>
      </div>

      <div>
        {activeTab === 'guide' && <UserTestingGuide />}
        {activeTab === 'feedback' && <FeedbackAnalysis />}
      </div>
    </div>
  );
};

export default Day2;