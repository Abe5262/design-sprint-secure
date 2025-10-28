import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslations } from '../../lib/i18n';
import { generateBusinessIdeas, generateImage } from '../../services/geminiService';
import { BusinessIdea } from '../../types';
import { CheckCircle, RefreshCw } from '../lucide-react';
import { trackEvent } from '../../lib/analytics';
import ImageModal from '../ImageModal';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

interface IdeaSelectionProps {
    onIdeaSelected: () => void;
}

const IdeaSelection: React.FC<IdeaSelectionProps> = ({ onIdeaSelected }) => {
  const { user, language, projectData, updateProjectData, isLoading, setIsLoading, setError } = useAppContext();
  const t = useTranslations(language);
  const [formState, setFormState] = useState({ skills: '', target: '', needs: '' });
  const [sketchStyle, setSketchStyle] = useState<'simple' | 'professional'>('simple');
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

  const examples = {
      en: [
        { name: "Designer", skills: "Graphic design, experience with fashion accessories.", target: "Young professionals who appreciate handcrafted goods.", needs: "Unique, personalized gifts and durable fashion items." },
        { name: "Hobbyist", skills: "Basic leatherworking as a hobby, good with hands-on crafts.", target: "Tourists and locals looking for cultural workshops.", needs: "Engaging, creative experiences and authentic souvenirs." },
        { name: "Entrepreneur", skills: "Business management, e-commerce, and marketing.", target: "Online shoppers looking for high-quality, sustainable products.", needs: "Customizable leather goods like wallets, belts, and bags that last a lifetime." },
      ],
      ko: [
        { name: "디자이너", skills: "그래픽 디자인, 패션 액세서리 경험.", target: "수공예품을 좋아하는 젊은 직장인.", needs: "독특하고 개인화된 선물, 내구성 있는 패션 아이템." },
        { name: "취미 생활자", skills: "가죽 공예 취미, 손재주 좋음.", target: "문화 워크샵을 찾는 관광객 및 현지인.", needs: "재미있고 창의적인 경험, 독창적인 기념품." },
        { name: "사업가", skills: "경영 관리, 전자상거래 및 마케팅.", target: "고품질의 지속 가능한 제품을 찾는 온라인 쇼핑객.", needs: "평생 사용할 수 있는 맞춤형 가죽 지갑, 벨트, 가방." },
      ],
      am: [
          { name: "디ዛይነር", skills: "የግራፊክ ዲዛይን፣ በፋሽን መለዋወጫዎች ልምድ።", target: "በእጅ የተሰሩ ምርቶችን የሚያደንቁ ወጣት ባለሙያዎች።", needs: "ልዩ፣ ግላዊ ስጦታዎች እና ዘላቂ የፋሽን እቃዎች።" },
          { name: "አማተር", skills: "እንደ የትርፍ ጊዜ ማሳለፊያ መሰረታዊ የቆዳ ስራ፣ በእጅ ስራዎች ጥሩ።", target: "የባህል ወርክሾፖችን የሚፈልጉ ቱሪስቶች እና የአካባቢው ነዋሪዎች።", needs: "አሳታፊ፣ ፈጠራ ልምዶች እና እውነተኛ መታሰቢያዎች።" },
          { name: "ሥራ ፈጣሪ", skills: "የንግድ አስተዳደር፣ ኢ-ኮሜርስ እና ግብይት።", target: "ከፍተኛ ጥራት ያላቸውን እና ዘላቂ ምርቶችን የሚፈልጉ የመስመር ላይ ገዢዎች።", needs: "ዕድሜ ልክ የሚቆዩ እንደ ቦርሳ፣ ቀበቶ እና ቦርሳ ያሉ ሊበጁ የሚችሉ የቆዳ ዕቃዎች።" },
      ]
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to upload base64 image to Firebase Storage
  const uploadBase64ToStorage = async (base64Url: string, userId: string, ideaIndex: number): Promise<string> => {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `projects/${userId}/ideas/${timestamp}_${ideaIndex}.png`);

      // Upload base64 string to Firebase Storage
      await uploadString(storageRef, base64Url, 'data_url');

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ Uploaded image ${ideaIndex} to Storage:`, downloadURL);
      return downloadURL;
    } catch (error) {
      console.error(`❌ Error uploading image ${ideaIndex} to Storage:`, error);
      throw error;
    }
  };

  const handleGenerateIdeas = async () => {
    if (!user) {
        setError("You must be logged in to generate ideas.");
        return;
    }

    setIsLoading(true);
    setError(null);
    trackEvent('Generate Ideas', 'Day 1 - Ideation', `Skills: ${formState.skills.substring(0, 50)}`);
    try {
      // Step 1: Generate ideas (text only) and show them immediately
      const ideas = await generateBusinessIdeas(formState.skills, formState.target, formState.needs, language, sketchStyle);
      await updateProjectData({ businessIdeas: ideas, selectedIdea: null });
      setIsLoading(false);

      // Step 2: Generate images in batches (4 at a time) in the background
      const batchSize = 4;
      let currentIdeas = [...ideas];
      setImageProgress({ current: 0, total: ideas.length });

      for (let i = 0; i < currentIdeas.length; i += batchSize) {
        const batch = currentIdeas.slice(i, i + batchSize);

        // Process batch in parallel with retry
        const batchResults = await Promise.all(
          batch.map(async (idea, batchIndex) => {
            const actualIndex = i + batchIndex;
            // Retry logic: try up to 2 times
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                // Generate base64 image
                const base64Url = await generateImage(idea.sketchPrompt);
                // Upload to Firebase Storage
                const storageUrl = await uploadBase64ToStorage(base64Url, user.uid, actualIndex);
                return { ...idea, sketchUrl: storageUrl };
              } catch (imageError) {
                console.error(`Error processing image for idea "${idea.title}" (attempt ${attempt + 1}):`, imageError);
                if (attempt === 1) {
                  // Last attempt failed
                  return { ...idea, sketchUrl: null };
                }
                // Wait 1 second before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            return { ...idea, sketchUrl: null };
          })
        );

        // Update the batch results in currentIdeas
        for (let j = 0; j < batchResults.length; j++) {
          currentIdeas[i + j] = batchResults[j];
        }

        // Update progress
        setImageProgress({ current: Math.min(i + batchSize, ideas.length), total: ideas.length });

        // Update UI with the batch
        await updateProjectData({ businessIdeas: [...currentIdeas] });
      }

      // Clear progress indicator when done
      setImageProgress({ current: 0, total: 0 });

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  const handleSelectIdea = (idea: BusinessIdea) => {
    // If the selected idea is different from the one already stored,
    // reset the downstream data to force regeneration for the new idea.
    if (projectData.selectedIdea?.title !== idea.title || projectData.selectedIdea?.description !== idea.description) {
        updateProjectData({
          selectedIdea: idea,
          threeStepSketches: null,
          selectedSketch: null,
          storyboards: null,
          selectedStoryboard: null,
        });
    } else {
      // If it's the same idea, just ensure it's selected.
      updateProjectData({ selectedIdea: idea });
    }
    
    trackEvent('Select Item', 'Day 1 - Ideation', `Idea: ${idea.title}`);
    onIdeaSelected();
  };
  
  const applyExample = (example: { skills: string; target: string; needs: string; }) => {
    setFormState({
        skills: example.skills,
        target: example.target,
        needs: example.needs
    });
  };

  const handleRegenerate = () => {
    const confirmMessage = language === 'ko' ?
      '기존 아이디어를 삭제하고 새로 생성하시겠습니까?' :
      language === 'am' ?
      'ያሉትን ሀሳቦች መሰረዝ እና አዲስ መፍጠር ይፈልጋሉ?' :
      'Delete existing ideas and generate new ones?';

    if (window.confirm(confirmMessage)) {
      // Reset all downstream data
      updateProjectData({
        businessIdeas: [],
        selectedIdea: null,
        threeStepSketches: null,
        selectedSketch: null,
        storyboards: null,
        selectedStoryboard: null,
      }).then(() => {
        handleGenerateIdeas();
      });
    }
  };

  const textAreaClasses = "p-2 mt-1 block w-full rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base";

  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border space-y-6">
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

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
          💡 {language === 'ko'
            ? '입력하신 기술, 고객, 요구사항에 포함된 키워드(예: 가죽 공예, 기술, 음식 서비스 등)를 바탕으로 아이디어가 생성됩니다.'
            : language === 'am'
            ? 'በእርስዎ ችሎታዎች፣ ዒላማ ደንበኞች እና ፍላጎቶች ውስጥ የሚጠቅሱአቸው ቁልፍ ቃላት (ለምሳሌ፣ የቆዳ እደ-ጥበብ፣ ቴክኖሎጂ፣ የምግብ አገልግሎት ወዘተ) ላይ በመመርኮዝ ሀሳቦች ይፈጠራሉ።'
            : 'Ideas will be generated based on the keywords you mention in your skills, target customers, and needs (e.g., leather crafts, technology, food service, etc.).'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground">{t('idea.prompt.skills')}</label>
          <textarea name="skills" value={formState.skills} onChange={handleInputChange} rows={4} className={textAreaClasses}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">{t('idea.prompt.target')}</label>
          <textarea name="target" value={formState.target} onChange={handleInputChange} rows={4} className={textAreaClasses}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">{t('idea.prompt.needs')}</label>
          <textarea name="needs" value={formState.needs} onChange={handleInputChange} rows={4} className={textAreaClasses}/>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {(examples[language as keyof typeof examples] || examples.en).map((ex, index) => (
            <button key={index} onClick={() => applyExample(ex)} className="bg-secondary text-secondary-foreground text-xs font-semibold py-1 px-3 rounded-full hover:bg-accent transition-colors">
                {t('apply.example')}: {ex.name}
            </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={handleGenerateIdeas} disabled={isLoading} className="flex-1 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isLoading ? t('loading') : t('generate.ideas')}
        </button>
        {projectData.businessIdeas.length > 0 && (
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

      {imageProgress.total > 0 && (
        <div className="bg-secondary/30 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {language === 'ko' ? '이미지 생성 중...' : language === 'am' ? 'ምስሎችን በመፍጠር ላይ...' : 'Generating images...'}
            </span>
            <span className="text-sm font-semibold text-primary">
              {imageProgress.current}/{imageProgress.total}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(imageProgress.current / imageProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {projectData.businessIdeas.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('your.ideas')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {projectData.businessIdeas.map((idea, index) => {
              const isSelected = projectData.selectedIdea?.title === idea.title && projectData.selectedIdea?.description === idea.description;
              return (
              <div key={index} className={`rounded-lg bg-card flex flex-col shadow-sm transition-all duration-200 ${isSelected ? 'border-2 border-day3 ring-4 ring-day3/20' : 'border border-border'}`}>
                <h4 className="font-bold text-foreground p-4 text-center border-b border-border">{idea.title}</h4>
                
                <div className="flex-grow p-4 grid grid-cols-2 gap-4 items-start">
                  <div className="pr-4 border-r border-border">
                    {idea.sketchUrl ? (
                      <img
                        src={idea.sketchUrl}
                        alt={`Sketch for ${idea.title}`}
                        className="w-full aspect-square object-cover rounded-md bg-white shadow-inner cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setModalImage({ url: idea.sketchUrl!, alt: idea.title })}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-secondary rounded-md animate-pulse"></div>
                    )}
                  </div>

                  <div className="text-base text-muted-foreground space-y-2">
                    {idea.description.split(/\n|(?=•)/).filter(line => line.trim()).map((line, idx) => (
                      <p key={idx} className="leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border-t border-border">
                  <button 
                    onClick={() => handleSelectIdea(idea)}
                    disabled={isSelected}
                    className={`w-full font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${isSelected ? 'bg-day3 text-white cursor-default' : 'bg-background text-primary border-2 border-primary hover:bg-accent'}`}
                  >
                    {isSelected && <CheckCircle className="w-4 h-4" />}
                    {isSelected ? t('idea.selected') : t('select.idea')}
                  </button>
                </div>
              </div>
            )})}
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

export default IdeaSelection;