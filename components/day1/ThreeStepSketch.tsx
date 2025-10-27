import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { generateThreeStepSketch, generateImage } from '../../services/geminiService';
import { useTranslations } from '../../lib/i18n';
import { BusinessIdea, SketchStep } from '../../types';
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

        // Step 1: Generate sketch structure
        setGenerationProgress({ current: 0, total: 1, stage: language === 'ko' ? '스케치 구조 생성 중...' : language === 'am' ? 'የንድፍ አወቃቀር በመፍጠር ላይ...' : 'Generating sketch structure...' });
        const sketchDetailsVariations = await generateThreeStepSketch(editableIdea, language);

        await updateProjectData({ threeStepSketches: sketchDetailsVariations, selectedSketch: null });

        // Step 2: Generate images in batches
        const totalImages = Object.keys(sketchDetailsVariations).length * 3; // 3 variations × 3 steps = 9 images
        let completedImages = 0;

        setGenerationProgress({ current: 0, total: totalImages, stage: language === 'ko' ? '이미지 생성 중...' : language === 'am' ? 'ምስሎችን በመፍጠር ላይ...' : 'Generating images...' });

        let currentSketches = JSON.parse(JSON.stringify(sketchDetailsVariations));

        // Collect all steps with their positions
        const allSteps: Array<{ vKey: string; sIndex: number; step: SketchStep }> = [];
        for (const vKey in currentSketches) {
            for (let sIndex = 0; sIndex < currentSketches[vKey].length; sIndex++) {
                allSteps.push({ vKey, sIndex, step: currentSketches[vKey][sIndex] });
            }
        }

        // Process in batches of 2 (reduced for better reliability)
        const batchSize = 2;
        for (let i = 0; i < allSteps.length; i += batchSize) {
            const batch = allSteps.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async ({ vKey, sIndex, step }) => {
                    // Retry logic: try up to 2 times
                    for (let attempt = 0; attempt < 2; attempt++) {
                        try {
                            const base64Url = await generateImage(step.imagePrompt);
                            return { vKey, sIndex, step: { ...step, imageUrl: base64Url }, success: true };
                        } catch (imageError) {
                            console.error(`Error processing sketch image (attempt ${attempt + 1}):`, imageError);
                            if (attempt === 1) {
                                // Last attempt failed, return without image
                                return { vKey, sIndex, step, success: false };
                            }
                            // Wait 1 second before retry
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    return { vKey, sIndex, step, success: false };
                })
            );

            // Update sketches with batch results
            for (const result of batchResults) {
                currentSketches[result.vKey][result.sIndex] = result.step;
                completedImages++;
            }

            // Save progress after each batch
            await updateProjectData({ threeStepSketches: JSON.parse(JSON.stringify(currentSketches)) });
            setGenerationProgress({ current: completedImages, total: totalImages, stage: language === 'ko' ? '이미지 생성 중...' : language === 'am' ? 'ምስሎችን በመፍጠር ላይ...' : 'Generating images...' });
        }

        setGenerationProgress({ current: 0, total: 0, stage: '' });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        await updateProjectData({ threeStepSketches: null });
        setGenerationProgress({ current: 0, total: 0, stage: '' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectSketch = (sketchVariation: SketchStep[], variationIndex: number) => {
    updateProjectData({ selectedSketch: sketchVariation });
    trackEvent('Select Item', 'Day 1 - Sketching', `Sketch Version: ${variationIndex + 1}`);
    onSketchSelected();
  };

  const handleRegenerate = () => {
    const confirmMessage = language === 'ko' ?
      '기존 스케치를 삭제하고 새로 생성하시겠습니까?' :
      language === 'am' ?
      'ያሉትን ንድፎችን መሰረዝ እና አዲስ መፍጠር ይፈልጋሉ?' :
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
  
  if (!projectData.threeStepSketches) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md border border-border space-y-4">
        <h3 className="text-2xl font-semibold text-foreground">{t('day1.confirm.idea.title')}</h3>
        <p className="text-base text-muted-foreground">
          {t('day1.confirm.idea.desc')}
        </p>
        
        {editableIdea ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-foreground">{t('day1.confirm.idea.field.title')}</label>
              <input 
                type="text"
                name="title"
                value={editableIdea.title}
                onChange={handleInputChange}
                className="p-2 mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">{t('day1.confirm.idea.field.description')}</label>
              <textarea 
                name="description"
                value={editableIdea.description}
                onChange={handleInputChange}
                rows={4}
                className="p-2 mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Please select an idea from the previous step.</div>
        )}

        <button onClick={handleGenerate} disabled={isLoading || !editableIdea} className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
          {isLoading ? t('loading') : <><Wand2 className="w-5 h-5" /> {t('day1.sketch.generate')}</>}
        </button>

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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={handleRegenerate}
          disabled={isLoading}
          className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-md hover:bg-accent disabled:opacity-50 transition-colors flex items-center gap-2"
          title={language === 'ko' ? '스케치 재생성' : language === 'am' ? 'ንድፎችን እንደገና ፍጠር' : 'Regenerate Sketches'}
        >
          <RefreshCw className="w-4 h-4" />
          <span>{language === 'ko' ? '재생성' : language === 'am' ? 'እንደገና ፍጠር' : 'Regenerate'}</span>
        </button>
      </div>

      {generationProgress.total > 0 && (
        <div className="bg-secondary/30 rounded-lg p-4 border border-border mb-6">
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

      {projectData.threeStepSketches && Object.values(projectData.threeStepSketches).map((variation, vIndex) => {
        const isSelected = JSON.stringify(projectData.selectedSketch) === JSON.stringify(variation);
         return (
         <div key={vIndex} className={`bg-card p-6 rounded-lg shadow-md transition-all ${isSelected ? 'border-2 border-day3 ring-4 ring-day3/20' : 'border border-border'}`}>
            <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('sketch.version')} {vIndex + 1}</h3>
            <div className="grid md:grid-cols-3 gap-6">
                {variation.map((step, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-secondary">
                    <h4 className="text-lg font-bold text-foreground mb-2">{index + 1}. {step.title}</h4>
                    {step.imageUrl ? (
                        <img
                          src={step.imageUrl}
                          alt={step.title}
                          className="w-full h-48 object-cover rounded-md mb-4 bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setModalImage({ url: step.imageUrl!, alt: step.title })}
                        />
                    ) : (
                        <div className="w-full h-48 bg-muted rounded-md mb-4 animate-pulse"></div>
                    )}
                    {step.description && (
                      <div className="text-sm text-secondary-foreground space-y-2">
                        {step.description.split(/\n|(?=•)/).filter(line => line.trim()).map((line, idx) => (
                          <p key={idx} className="leading-relaxed">{line}</p>
                        ))}
                      </div>
                    )}
                </div>
                ))}
            </div>
            <div className="mt-6">
              <button 
                onClick={() => handleSelectSketch(variation, vIndex)}
                disabled={isSelected}
                className={`w-full font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${isSelected ? 'bg-day3 text-white cursor-default' : 'bg-background text-primary border-2 border-primary hover:bg-accent'}`}
                >
                {isSelected ? <><CheckCircle className="w-4 h-4" />{t('sketch.selected')}</> : t('select.sketch')}
              </button>
            </div>
        </div>
      )})}

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