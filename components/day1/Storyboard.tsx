import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { generateStoryboardPages, generateImage } from '../../services/geminiService';
import { useTranslations } from '../../lib/i18n';
import { Wand2, CheckCircle, RefreshCw } from '../lucide-react';
import { StoryboardPage } from '../../types';
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
      const sketchSummary = projectData.selectedSketch.map((step, i) =>
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
        // Step 1: Generate storyboard structure
        setGenerationProgress({ current: 0, total: 1, stage: language === 'ko' ? '스토리보드 구조 생성 중...' : language === 'am' ? 'የታሪክ ሰሌዳ አወቃቀር በመፍጠር ላይ...' : 'Generating storyboard structure...' });
        // Use custom description if provided, otherwise use selectedSketch
        const pageVariations = customDescription
          ? await generateStoryboardPages(projectData.selectedIdea, projectData.selectedSketch || [], language, customDescription)
          : await generateStoryboardPages(projectData.selectedIdea, projectData.selectedSketch || [], language);
        await updateProjectData({ storyboards: pageVariations, selectedStoryboard: null });

        // Step 2: Generate images in batches
        const totalImages = Object.keys(pageVariations).length * 8; // 2 variations × 8 pages = 16 images
        let completedImages = 0;

        setGenerationProgress({ current: 0, total: totalImages, stage: language === 'ko' ? '이미지 생성 중...' : language === 'am' ? 'ምስሎችን በመፍጠር ላይ...' : 'Generating images...' });

        let currentStoryboards = JSON.parse(JSON.stringify(pageVariations));

        // Collect all pages with their positions
        const allPages: Array<{ vKey: string; pIndex: number; page: StoryboardPage }> = [];
        for (const vKey in currentStoryboards) {
            for (let pIndex = 0; pIndex < currentStoryboards[vKey].length; pIndex++) {
                allPages.push({ vKey, pIndex, page: currentStoryboards[vKey][pIndex] });
            }
        }

        // Process in batches of 2 (reduced for better reliability)
        const batchSize = 2;
        for (let i = 0; i < allPages.length; i += batchSize) {
            const batch = allPages.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async ({ vKey, pIndex, page }) => {
                    // Retry logic: try up to 2 times
                    for (let attempt = 0; attempt < 2; attempt++) {
                        try {
                            const base64Url = await generateImage(page.imagePrompt);
                            return { vKey, pIndex, page: { ...page, imageUrl: base64Url }, success: true };
                        } catch (imageError) {
                            console.error(`Error processing storyboard image (attempt ${attempt + 1}):`, imageError);
                            if (attempt === 1) {
                                // Last attempt failed, return without image
                                return { vKey, pIndex, page, success: false };
                            }
                            // Wait 1 second before retry
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    return { vKey, pIndex, page, success: false };
                })
            );

            // Update storyboards with batch results
            for (const result of batchResults) {
                currentStoryboards[result.vKey][result.pIndex] = result.page;
                completedImages++;
            }

            // Save progress after each batch
            await updateProjectData({ storyboards: JSON.parse(JSON.stringify(currentStoryboards)) });
            setGenerationProgress({ current: completedImages, total: totalImages, stage: language === 'ko' ? '이미지 생성 중...' : language === 'am' ? 'ምስሎችን በመፍጠር ላይ...' : 'Generating images...' });
        }

        setGenerationProgress({ current: 0, total: 0, stage: '' });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        await updateProjectData({ storyboards: null });
        setGenerationProgress({ current: 0, total: 0, stage: '' });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSelectStoryboard = (storyboard: StoryboardPage[], variationIndex: number) => {
    updateProjectData({ selectedStoryboard: storyboard });
    trackEvent('Select Item', 'Day 1 - Storyboarding', `Storyboard Version: ${variationIndex + 1}`);
  };

  const handleRegenerate = () => {
    const confirmMessage = language === 'ko' ?
      '기존 스토리보드를 삭제하고 새로 생성하시겠습니까?' :
      language === 'am' ?
      'ያሉትን ታሪክ ሰሌዳዎችን መሰረዝ እና አዲስ መፍጠር ይፈልጋሉ?' :
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

  if (!projectData.storyboards) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md border border-border">
        <h3 className="text-2xl font-semibold text-foreground text-center">{t('storyboard.title')}</h3>
        <p className="text-base text-muted-foreground my-2 text-center">
          {t('day1.storyboard.confirm.desc')}
        </p>
        <p className="font-semibold text-foreground my-4 p-3 bg-secondary border border-border rounded-md text-center">
          "{projectData.selectedIdea?.title}"
        </p>

        <div className="my-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            {language === 'ko' ? '스토리보드 기반 (수정 가능)' : language === 'am' ? 'የታሪክ ሰሌዳ መሰረት (ሊስተካከል ይችላል)' : 'Storyboard Basis (Editable)'}
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            rows={6}
            className="w-full p-3 rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-ring"
            placeholder={language === 'ko' ? '3단계 스케치 또는 직접 입력한 내용을 바탕으로 스토리보드가 생성됩니다.' : language === 'am' ? 'የታሪክ ሰሌዳው በ3-ደረጃ ንድፍ ወይም በእርስዎ በተገባው ይዘት ላይ ይመረኮዛል።' : 'Storyboard will be based on the 3-step sketch or your custom input.'}
          />
        </div>

        <div className="text-center">
            <button onClick={handleGenerate} disabled={isLoading || !customDescription} className="bg-primary text-primary-foreground font-bold py-3 px-5 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-opacity inline-flex items-center justify-center gap-2">
            {isLoading ? t('loading') : <><Wand2 className="w-5 h-5" /> {t('day1.storyboard.generate')}</>}
            </button>
        </div>

        {generationProgress.total > 0 && (
          <div className="bg-secondary/30 rounded-lg p-4 border border-border mt-4">
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
          title={language === 'ko' ? '스토리보드 재생성' : language === 'am' ? 'ታሪክ ሰሌዳዎችን እንደገና ፍጠር' : 'Regenerate Storyboards'}
        >
          <RefreshCw className="w-4 h-4" />
          <span>{language === 'ko' ? '재생성' : language === 'am' ? 'እንደገና ፍጠር' : 'Regenerate'}</span>
        </button>
      </div>

       {isLoading && projectData.storyboards && Object.values(projectData.storyboards).flat().some(p => !p.imageUrl) && (
        <div className="text-center text-sm text-muted-foreground pb-4">Loading images...</div>
       )}
       {projectData.storyboards && Object.values(projectData.storyboards).map((variation, vIndex) => {
        const isSelected = JSON.stringify(projectData.selectedStoryboard) === JSON.stringify(variation);
        return (
        <div key={vIndex} className={`bg-card p-6 rounded-lg shadow-md transition-all ${isSelected ? 'border-2 border-day3 ring-4 ring-day3/20' : 'border border-border'}`}>
          <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('storyboard.version')} {vIndex + 1}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {variation.map((page, index) => (
              <div key={index} className="border-2 border-border rounded-lg p-4 bg-secondary">
                <h4 className="text-base font-bold text-foreground mb-2">{index + 1}. {page.title}</h4>
                {page.imageUrl ? (
                  <img
                    src={page.imageUrl}
                    alt={page.title}
                    className="w-full aspect-square object-cover rounded-md mb-3 bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setModalImage({ url: page.imageUrl!, alt: page.title })}
                  />
                ) : (
                    <div className="w-full aspect-square bg-muted rounded-md animate-pulse mb-3"></div>
                )}
                {page.description && (
                  <div className="text-xs text-muted-foreground space-y-1.5">
                    {page.description.split(/\n|(?=•)/).filter(line => line.trim()).map((line, idx) => (
                      <p key={idx} className="leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
           <div className="mt-6">
              <button 
                onClick={() => handleSelectStoryboard(variation, vIndex)}
                disabled={isSelected}
                className={`w-full font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${isSelected ? 'bg-day3 text-white cursor-default' : 'bg-background text-primary border-2 border-primary hover:bg-accent'}`}
                >
                {isSelected ? <><CheckCircle className="w-4 h-4" />{t('storyboard.selected')}</> : t('select.storyboard')}
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

export default Storyboard;