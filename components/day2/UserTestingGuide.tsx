
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslations } from '../../lib/i18n';
import { generateInterviewQuestions } from '../../services/geminiService';
import { InterviewQuestion } from '../../types';
import { AlertTriangle, MessageSquare, List, Check, Wand2 } from '../lucide-react';
import { trackEvent } from '../../lib/analytics';

const UserTestingGuide: React.FC = () => {
  const { language, projectData, updateProjectData, isLoading, setIsLoading, setError, error } = useAppContext();
  const t = useTranslations(language);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [appDescription, setAppDescription] = useState('');

  useEffect(() => {
    if (projectData.selectedIdea) {
      setAppDescription(`${projectData.selectedIdea.title}: ${projectData.selectedIdea.description}`);
    }
  }, [projectData.selectedIdea]);

  useEffect(() => {
    if (projectData.interviewQuestions && projectData.interviewQuestions.length > 0) {
      setQuestions(projectData.interviewQuestions);
    }
  }, [projectData.interviewQuestions]);

  const handleGenerateQuestions = async () => {
    if (!projectData.selectedIdea) {
      setError("Please select a business idea on Day 1 first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    trackEvent('Generate Interview Questions', 'Day 2 - Testing', `Idea: ${projectData.selectedIdea.title}`);
    try {
      const result = await generateInterviewQuestions(projectData.selectedIdea, language);
      setQuestions(result);
      await updateProjectData({ interviewQuestions: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const GuideCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-lg p-5 border border-gray-200">{title && <h3 className="text-md font-semibold text-gray-800 mb-3">{title}</h3>}{children}</div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="font-bold">{t('day2.notice.title')}</span>{' '}
              {t('day2.notice.content')}
            </p>
          </div>
        </div>
      </div>

      <GuideCard title={t('day2.interview.guide.title')}>
        <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-semibold text-gray-700">{t('day2.interviewer.role')}</h4>
                <p className="text-sm text-gray-600 mt-1">{t('day2.interviewer.role.desc')}</p>
            </div>
            
            <h4 className="font-semibold text-gray-700 pt-2">{t('day2.conduct.steps.title')}</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                <div className="bg-green-50 p-3 rounded-md"><strong>{t('day2.step.friendly.welcome')}</strong><p className="text-gray-600 mt-1">{t('day2.step.friendly.welcome.desc')}</p></div>
                <div className="bg-green-50 p-3 rounded-md"><strong>{t('day2.step.context.questions')}</strong><p className="text-gray-600 mt-1">{t('day2.step.context.questions.desc')}</p></div>
                <div className="bg-green-50 p-3 rounded-md"><strong>{t('day2.step.introduce.prototype')}</strong><p className="text-gray-600 mt-1">{t('day2.step.introduce.prototype.desc')}</p></div>
                <div className="bg-green-50 p-3 rounded-md"><strong>{t('day2.step.tasks.nudges')}</strong><p className="text-gray-600 mt-1">{t('day2.step.tasks.nudges.desc')}</p></div>
                <div className="bg-green-50 p-3 rounded-md"><strong>{t('day2.step.debrief')}</strong><p className="text-gray-600 mt-1">{t('day2.step.debrief.desc')}</p></div>
            </div>

            <h4 className="font-semibold text-gray-700 pt-2">{t('day2.interviewer.tips.title')}</h4>
             <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded-md"><strong>{t('day2.tip.be.good.host')}</strong><p className="text-gray-600 mt-1">{t('day2.tip.be.good.host.desc')}</p></div>
                <div className="bg-blue-50 p-3 rounded-md"><strong>{t('day2.tip.open.ended')}</strong><p className="text-gray-600 mt-1">{t('day2.tip.open.ended.desc')}</p></div>
                <div className="bg-blue-50 p-3 rounded-md"><strong>{t('day2.tip.curiosity.mindset')}</strong><p className="text-gray-600 mt-1">{t('day2.tip.curiosity.mindset.desc')}</p></div>
            </div>
        </div>
      </GuideCard>
      
      <GuideCard title="">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{t('day2.question.generation.title')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('day2.app.idea.desc')}</p>
        
        <div className="space-y-3">
          <div>
            <label htmlFor="app-description" className="block text-sm font-medium text-gray-700">{t('day2.app.idea.desc')}</label>
            <textarea
              id="app-description"
              rows={4}
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              className="p-2 mt-1 block w-full rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
              placeholder={t('day2.app.idea.placeholder')}
            />
          </div>
          <button
            onClick={handleGenerateQuestions}
            disabled={isLoading || !appDescription}
            className="w-full flex justify-center items-center gap-2 bg-day2 text-white font-bold py-2.5 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? t('loading') : <><Wand2 className="w-5 h-5"/> {t('day2.generate.questions')}</>}
          </button>
        </div>
      </GuideCard>

      {(isLoading || questions.length > 0 || error) && (
        <GuideCard title="">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('day2.generated.questions.title')}</h3>
                {questions.length > 0 && !isLoading && (
                    <button onClick={handleGenerateQuestions} className="text-sm font-semibold text-day2 hover:underline">{t('day2.regenerate')}</button>
                )}
            </div>

            {isLoading && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-3 py-1">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="space-y-5">
              {questions.map((q, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold uppercase text-day2 tracking-wide">{q.category} &middot; #{index + 1}</p>
                  <p className="text-md font-semibold text-gray-800 mt-1.5">{q.question}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-semibold">{t('day2.question.intent')}:</span> {q.intent}
                  </p>
                  <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                    <p className="font-semibold">{t('day2.question.followup')}:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {q.followUp.map((fu, i) => <li key={i}>{fu}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
        </GuideCard>
      )}
    </div>
  );
};

export default UserTestingGuide;