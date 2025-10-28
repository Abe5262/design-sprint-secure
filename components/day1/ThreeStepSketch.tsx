import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { generateThreeStepComposite } from '../../services/geminiService';
import { useTranslations } from '../../lib/i18n';
import { BusinessIdea, ThreeStepSketchComposite } from '../../types';
import { Wand2, CheckCircle, RefreshCw } from '../lucide-react';
import { trackEvent } from '../../lib/analytics';
import ImageModal from '../ImageModal';

interface ThreeStepSketchProps {
  onSketchSelected: () => void;
}

const ThreeStepSketch: React.FC<ThreeStepSketchProps> = ({ onSketchSelected }) => {
  const { user, language, projectData, updateProjectData, isLoading, setIsLoading, setError } = useAppContext();
  const t = useTranslations(language);
  const [editableIdea, setEditableIdea] = useState<BusinessIdea | null>(projectData.selectedIdea);
  const [sketchStyle, setSketchStyle] = useState<'simple' | 'professional'>('simple');
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, stage: '' });
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    setEditableIdea(projectData.selectedIdea);
  }, [projectData.selectedIdea]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editableIdea) {
      const { name, value } = e.target;
      setEditableIdea({ ...editableIdea, [name]: value });
    }
  };

  const handleGenerate = async () => {
    if (editableIdea && user) {
      setIsLoading(true);
      setError(null);
      trackEvent('Generate Sketch', 'Day 1 - Sketching', `Idea: ${editableIdea.title}`);

      try {
        if (JSON.stringify(editableIdea) !== JSON.stringify(projectData.selectedIdea)) {
            await updateProjectData({ selectedIdea: editableIdea });
        }

        // Generate composite sketches (3 variations with composite images)
        setGenerationProgress({
          current: 0,
          total: 3,
          stage: language === 'ko' ? '3단계 스케치 생성 중...' : language === 'am' ? 'የ3-ደረጃ ንድፍ በመፍጠር ላይ...' : 'Generating 3-step sketches...'
        });

        const compositeVariations = await generateThreeStepComposite(editableIdea, language, sketchStyle);

        await updateProjectData({ threeStepSketches: compositeVariations, selectedSketch: null });

      } catch (err) {
        console.error('Error in handleGenerate:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        // Always reset loading state
        setGenerationProgress({ current: 0, total: 0, stage: '' });
        setIsLoading(false);
      }
    }
  };

  const handleSelectSketch = (sketch: ThreeStepSketchComposite) => {
    updateProjectData({ selectedSketch: sketch });
    trackEvent('Select Sketch', 'Day 1 - Sketching', 'User selected a 3-step sketch variation');
    onSketchSelected();
  };

  const handleRegenerate = () => {
    const confirmMessage = language === 'ko' ?
      '기존 스케치를 삭제하고 새로 생성하시겠습니까?' :
      language === 'am' ?
      'ያሉትን ንድፎች መሰረዝ እና አዲስ መፍጠር ይፈልጋሉ?' :
      'Delete existing sketches and generate new ones?';

    if (window.confirm(confirmMessage)) {
      updateProjectData({
        threeStepSketches: null,
        selectedSketch: null,
        storyboards: null,
        selectedStoryboard: null,
      }).then(() => {
        handleGenerate();
      });
    }
  };

  if (!editableIdea) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md border border-border">
        <p className="text-center text-muted-foreground">{t('no.idea.selected')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">{t('idea.title')}</label>
          <input
            type="text"
            name="title"
            value={editableIdea.title}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">{t('idea.description')}</label>
          <textarea
            name="description"
            value={editableIdea.description}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full p-2 rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
          />
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 border border-border">
          <label className="block text-sm font-medium text-foreground mb-3">
            {language === 'ko' ? '스케치 스타일' : language === 'am' ? 'የንድፍ ዘይቤ' : 'Sketch Style'}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sketchStyle"
                value="simple"
                checked={sketchStyle === 'simple'}
                onChange={(e) => setSketchStyle(e.target.value as 'simple' | 'professional')}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-foreground">
                {language === 'ko' ? '🎨 간단한 스타일 (어린이 그림)' : language === 'am' ? '🎨 ቀላል ዘይቤ (የልጅ ስዕል)' : '🎨 Simple Style (Child-like Drawing)'}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sketchStyle"
                value="professional"
                checked={sketchStyle === 'professional'}
                onChange={(e) => setSketchStyle(e.target.value as 'simple' | 'professional')}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-foreground">
                {language === 'ko' ? '✏️ 전문적인 스타일 (손그림 스케치)' : language === 'am' ? '✏️ ሙያዊ ዘይቤ (በእጅ የተሳለ ንድፍ)' : '✏️ Professional Style (Hand-drawn Sketch)'}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex-1 bg-day1 text-white font-bold py-3 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Wand2 className="w-5 h-5" />
          {isLoading ? t('loading') : t('generate.sketch')}
        </button>
        {projectData.threeStepSketches && projectData.threeStepSketches.length > 0 && (
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

      {projectData.threeStepSketches && projectData.threeStepSketches.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('three.step.variations')}</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {projectData.threeStepSketches.map((composite, index) => {
              const isSelected = JSON.stringify(projectData.selectedSketch) === JSON.stringify(composite);

              return (
                <div
                  key={index}
                  className={`rounded-lg bg-card shadow-sm transition-all duration-200 ${
                    isSelected ? 'border-2 border-day1 ring-4 ring-day1/20' : 'border border-border'
                  }`}
                >
                  {composite.compositeImageUrl ? (
                    <div
                      className="w-full cursor-pointer hover:opacity-90 transition-opacity p-4"
                      onClick={() => setModalImage({ url: composite.compositeImageUrl!, alt: `3-Step Sketch ${index + 1}` })}
                    >
                      <img
                        src={composite.compositeImageUrl}
                        alt={`3-Step Sketch ${index + 1}`}
                        className="w-full rounded-md bg-white shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[3/4] bg-secondary animate-pulse rounded-md m-4"></div>
                  )}

                  <div className="p-4 space-y-4">
                    {composite.steps.map((step, idx) => (
                      <div key={idx} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                        <h4 className="text-base font-bold text-foreground mb-2">
                          {idx + 1}. {step.title}
                        </h4>
                        {step.description && (
                          <div className="text-sm text-secondary-foreground space-y-2">
                            {step.description.split(/\n|(?=•)/).filter(line => line.trim()).map((line, lineIdx) => (
                              <p key={lineIdx} className="leading-relaxed">{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-border">
                    <button
                      onClick={() => handleSelectSketch(composite)}
                      disabled={isSelected}
                      className={`w-full font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-day1 text-white cursor-default'
                          : 'bg-background text-primary border-2 border-primary hover:bg-accent'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                      {isSelected ? t('sketch.selected') : t('select.sketch')}
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

export default ThreeStepSketch;
