import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslations } from '../lib/i18n';
import IdeaSelection from './day1/IdeaSelection';
import ThreeStepSketch from './day1/ThreeStepSketch';
import Storyboard from './day1/Storyboard';
import SaveStatus from './SaveStatus';
import { CheckCircle, Circle } from 'lucide-react';

const Day1: React.FC = () => {
  const [activeTab, setActiveTab] = useState('idea');
  const { language, projectData } = useAppContext();
  const t = useTranslations(language);

  const tabs = [
    { id: 'idea', label: t('step1.title'), completed: !!projectData.selectedIdea },
    { id: 'sketch', label: t('step2.title'), completed: !!projectData.selectedSketch, disabled: !projectData.selectedIdea },
    { id: 'storyboard', label: t('step3.title'), completed: !!projectData.selectedStoryboard, disabled: !projectData.selectedSketch },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-foreground">{t('day1.title')}</h1>
        <SaveStatus />
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-day1 text-day1'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${tab.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {tab.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-400" />}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'idea' && <IdeaSelection onIdeaSelected={() => setActiveTab('sketch')} />}
        {activeTab === 'sketch' && <ThreeStepSketch onSketchSelected={() => setActiveTab('storyboard')} />}
        {activeTab === 'storyboard' && <Storyboard />}
      </div>
    </div>
  );
};

export default Day1;