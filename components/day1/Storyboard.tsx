import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { generateStoryboardComposite } from '../../services/geminiService';
import { useTranslations } from '../../lib/i18n';
import { Wand2, CheckCircle, RefreshCw } from '../lucide-react';
import { StoryboardComposite } from '../../types';
import { trackEvent } from '../../lib/analytics';
import ImageModal from '../ImageModal';

const Storyboard: React.FC = () => {
  const { user, language, projectData, updateProjectData, isLoading, setIsLoading, setError } = useAppContext();
  const t = useTranslations(language);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, stage: '' });
  const [customDescription, setCustomDescription] = useState('');
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

  // Set default description from selectedSketch
  React.useEffect(() => {
    if (projectData.selectedSketch && !customDescription) {
      const sketchSummary = projectData.selectedSketch.steps.map((step, i) =>
        `${language === 'ko' ? '단계' : language === 'am' ? 'ደረጃ' : 'Step'} ${i+1}: ${step.title}`
      ).join('\n');
      setCustomDescription(sketchSummary);
    }
  }, [projectData.selectedSketch, language]);

  const handleGenerate = async () => {
    if (projectData.selectedIdea && (projectData.selectedSketch || customDescription) && user) {
      setIsLoading(true);
      setError(null);
      trackEvent('Generate Storyboard', 'Day 1 - Storyboarding', `Idea: ${projectData.selectedIdea.title}`);
      try {
        // Generate composite storyboards (2 variations with composite images)
        setGenerationProgress({
          current: 0,
          total: 2,
          stage: language === 'ko' ? '스토리보드 생성 중...' : language === 'am' ? 'የታሪክ ሰሌዳ በመፍጠር ላይ...' : 'Generating storyboards...'
        });

        const compositeVariations = await generateStoryboardComposite(
          projectData.selectedIdea,
          language,
          customDescription
        );

        await updateProjectData({ storyboards: compositeVariations, selectedStoryboard: null });
        setGenerationProgress({ current: 0, total: 0, stage: '' });
        setIsLoading(false);

      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
        setGenerationProgress({ current: 0, total: 0, stage: '' });
      }
    }
  };

  const handleSelectStoryboard = (storyboard: StoryboardComposite) => {
    updateProjectData({ selectedStoryboard: storyboard });
    trackEvent('Select Storyboard', 'Day 1 - Storyboarding', 'User selected a storyboard variation');
  };

  const handleRegenerate = () => {
    const confirmMessage = language === 'ko' ?
      '기존 스토리보드를 삭제하고 새로 생성하시겠습니까?' :
      language === 'am' ?
      'ያሉትን የታሪክ ሰሌዳዎች መሰረዝ እና አዲስ መፍጠር ይፈልጋሉ?' :
      'Delete existing storyboards and generate new ones?';

    if (window.confirm(confirmMessage)) {
      updateProjectData({
        storyboards: null,
        selectedStoryboard: null,
      }).then(() => {
        handleGenerate();
      });
    }
  };

  if (!projectData.selectedIdea) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md border border-border">
        <p className="text-center text-muted-foreground">{t('no.idea.selected')}</p>
      </div>
    );
  }

  if (!projectData.selectedSketch) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md border border-border">
        <p className="text-center text-muted-foreground">{t('no.sketch.selected')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('selected.idea')}</h3>
        <p className="text-base text-foreground font-medium">{projectData.selectedIdea.title}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('custom.description.optional')}
        </label>
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          rows={4}
          className="w-full p-2 rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
          placeholder={t('custom.description.placeholder')}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex-1 bg-day2 text-white font-bold py-3 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Wand2 className="w-5 h-5" />
          {isLoading ? t('loading') : t('generate.storyboard')}
        </button>
        {projectData.storyboards && Object.keys(projectData.storyboards).length > 0 && (
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="bg-secondary text-secondary-foreground font-bold py-3 px-4 rounded-md hover:bg-accent disabled:opacity-50 transition-colors flex items-center gap-2"
            title={language === 'ko' ? '재생성' : language === 'am' ? 'እንደገና ፍጠር' : 'Regenerate'}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">{language === 'ko' ? '재생성' : language === 'am' ? 'እንደገና ፍጠር' : 'Regenerate'}</span>
          </button>
        )}
      </div>

      {generationProgress.total > 0 && (
        <div className="bg-secondary/30 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {generationProgress.stage}
            </span>
            <span className="text-sm font-semibold text-primary">
              {generationProgress.current}/{generationProgress.total}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {projectData.storyboards && Object.keys(projectData.storyboards).length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('storyboard.variations')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(projectData.storyboards).map(([vKey, composite]) => {
              const isSelected = JSON.stringify(projectData.selectedStoryboard) === JSON.stringify(composite);

              return (
                <div
                  key={vKey}
                  className={`rounded-lg bg-card shadow-sm transition-all duration-200 ${
                    isSelected ? 'border-2 border-day2 ring-4 ring-day2/20' : 'border border-border'
                  }`}
                >
                  {composite.compositeImageUrl ? (
                    <div
                      className="w-full cursor-pointer hover:opacity-90 transition-opacity p-4"
                      onClick={() => setModalImage({ url: composite.compositeImageUrl!, alt: `Storyboard ${vKey}` })}
                    >
                      <img
                        src={composite.compositeImageUrl}
                        alt={`Storyboard ${vKey}`}
                        className="w-full rounded-md bg-white shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-secondary animate-pulse rounded-md m-4"></div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {composite.pages.map((page, idx) => (
                        <div key={idx} className="border border-border rounded-md p-3">
                          <h4 className="text-sm font-bold text-foreground mb-1">
                            {idx + 1}. {page.title}
                          </h4>
                          {page.description && (
                            <div className="text-xs text-muted-foreground space-y-1.5">
                              {page.description.split(/\n|(?=•)/).filter(line => line.trim()).map((line, lineIdx) => (
                                <p key={lineIdx} className="leading-relaxed">{line}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-border">
                    <button
                      onClick={() => handleSelectStoryboard(composite)}
                      disabled={isSelected}
                      className={`w-full font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-day2 text-white cursor-default'
                          : 'bg-background text-primary border-2 border-primary hover:bg-accent'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                      {isSelected ? t('storyboard.selected') : t('select.storyboard')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
};

export default Storyboard;
