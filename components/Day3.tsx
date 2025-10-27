import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslations } from '../lib/i18n';
import StitchGuide from './day3/StitchGuide';
import AIPromptGenerator from './day3/AIPromptGenerator';
import SaveStatus from './SaveStatus';
import { BookOpen, Wand2 } from './lucide-react';

const Day3: React.FC = () => {
  const { language } = useAppContext();
  const t = useTranslations(language);
  const [activeTab, setActiveTab] = useState('guide');

  const tabs = [
    { id: 'guide', label: t('day3.tab.guide'), icon: BookOpen },
    { id: 'prompt', label: t('day3.tab.prompt'), icon: Wand2 },
  ];

  return (
    <div className="space-y-8">
      <div className="shadow-xl rounded-lg overflow-hidden border border-border">
        <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/lVF_k12GO-Y?si=su_uzaSpWxT9rPX6"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-foreground">{t('day3.title')}</h1>
        <SaveStatus />
      </div>
      
      <div className="flex justify-center">
        <div className="relative p-1 bg-secondary rounded-full flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative z-10 flex-1 px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 focus:outline-none flex items-center justify-center gap-2"
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-secondary-foreground'}`} />
              <span className={activeTab === tab.id ? 'text-white' : 'text-secondary-foreground'}>{tab.label}</span>
            </button>
          ))}
          <div
            className="absolute top-1 bottom-1 bg-day3 rounded-full shadow-md transition-all duration-300"
            style={{
              width: `calc(50% - 4px)`,
              left: activeTab === 'guide' ? '4px' : 'calc(50% + 4px)',
            }}
          ></div>
        </div>
      </div>

      <div>
        {activeTab === 'guide' && <StitchGuide onGeneratePromptClick={() => setActiveTab('prompt')} />}
        {activeTab === 'prompt' && <AIPromptGenerator />}
      </div>
    </div>
  );
};

export default Day3;