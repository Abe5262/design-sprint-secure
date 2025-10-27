// FIX: The original content of this file was incorrect HTML. It has been replaced with a proper React component to render the Stitch Guide.
// This resolves the module import error in Day3.tsx and renders the guide content as intended.
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslations } from '../../lib/i18n';
import { Code, Smartphone, Zap, Palette, LayoutGrid, AppWindow, ShoppingCart, Wand2 } from '../lucide-react';
import { storage } from '../../lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface StitchGuideProps {
  onGeneratePromptClick: () => void;
}

const StitchGuide: React.FC<StitchGuideProps> = ({ onGeneratePromptClick }) => {
    const { language } = useAppContext();
    const t = useTranslations(language);
    const [stepImages, setStepImages] = useState<{ [key: number]: string }>({});

    const FeatureCard: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
        <div className="bg-secondary p-4 rounded-lg">
            <Icon className="w-8 h-8 text-day3 mb-2" />
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );

    const BuildCard: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
        <div className="bg-secondary p-4 rounded-lg text-center">
            <Icon className="w-10 h-10 text-day3 mx-auto mb-3" />
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
    
    // Load images from Firebase Storage
    useEffect(() => {
        const loadStepImages = async () => {
            const imageUrls: { [key: number]: string } = {};

            // Actual file names in Firebase Storage
            const fileNames = [
                '1. main.png',
                '2. experiment.png',
                '3. prompt.png',
                '4. play.png',
                '5. result.png',
                '6. upload figma.png',
                '7. code.png',
                '8. theme.png'
            ];

            for (let i = 0; i < fileNames.length; i++) {
                try {
                    const imageRef = ref(storage, fileNames[i]);
                    const imageUrl = await getDownloadURL(imageRef);
                    imageUrls[i + 1] = imageUrl; // Store with 1-based index
                } catch (error) {
                    console.error(`Error loading image "${fileNames[i]}":`, error);
                }
            }

            setStepImages(imageUrls);
        };

        loadStepImages();
    }, []);

    const Step: React.FC<{ num: number, title: string, description: string }> = ({ num, title, description }) => (
      <div className="bg-secondary p-6 rounded-lg">
        {stepImages[num] && (
          <div className="mb-6">
            <img
              src={stepImages[num]}
              alt={`Step ${num}: ${title}`}
              className="w-full h-auto object-contain rounded-md shadow-lg border border-border"
            />
          </div>
        )}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-day3 text-white rounded-full flex items-center justify-center font-bold text-lg">{num}</div>
          <div>
            <h4 className="font-semibold text-foreground text-lg">{title}</h4>
            <p className="text-muted-foreground text-base mt-2">{description}</p>
          </div>
        </div>
      </div>
    );
    
    const TipCard: React.FC<{ title: string, description: string }> = ({ title, description }) => (
        <div className="border-l-4 border-day3 bg-secondary p-4 rounded-r-lg">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
    );

    const ExampleCard: React.FC<{ title: string, content: string }> = ({ title, content }) => (
        <div className="bg-secondary p-4 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground font-mono bg-background/50 p-3 rounded-md">{content}</p>
        </div>
    );


    return (
        <div className="bg-card p-6 md:p-8 rounded-lg shadow-md border border-border space-y-12">
            
            <section className="text-center">
                <h2 className="text-3xl font-bold text-foreground">{t('day3.what.is.stitch.title')}</h2>
                <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">{t('day3.what.is.stitch.desc')}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 text-left">
                    <FeatureCard icon={Code} title={t('day3.feature.code.title')} description={t('day3.feature.code.desc')} />
                    <FeatureCard icon={Smartphone} title={t('day3.feature.responsive.title')} description={t('day3.feature.responsive.desc')} />
                    <FeatureCard icon={Zap} title={t('day3.feature.prototyping.title')} description={t('day3.feature.prototyping.desc')} />
                    <FeatureCard icon={Palette} title={t('day3.feature.modern.ui.title')} description={t('day3.feature.modern.ui.desc')} />
                </div>
            </section>
            
            <section className="text-center">
                <h2 className="text-3xl font-bold text-foreground">{t('day3.what.can.build.title')}</h2>
                <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">{t('day3.what.can.build.desc')}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                    <BuildCard icon={AppWindow} title={t('day3.build.landing.title')} description={t('day3.build.landing.desc')} />
                    <BuildCard icon={LayoutGrid} title={t('day3.build.webapp.title')} description={t('day3.build.webapp.desc')} />
                    <BuildCard icon={Smartphone} title={t('day3.build.mobile.title')} description={t('day3.build.mobile.desc')} />
                    <BuildCard icon={ShoppingCart} title={t('day3.build.ecommerce.title')} description={t('day3.build.ecommerce.desc')} />
                </div>
            </section>
            
            <section>
                <h2 className="text-3xl font-bold text-foreground text-center">{t('day3.how.to.use.stitch.title')}</h2>
                <div className="mt-8 space-y-8">
                    <Step num={1} title={t('day3.how.to.use.stitch.step1.title')} description={t('day3.how.to.use.stitch.step1.desc')} />
                    <Step num={2} title={t('day3.how.to.use.stitch.step2.title')} description={t('day3.how.to.use.stitch.step2.desc')} />
                    <Step num={3} title={t('day3.how.to.use.stitch.step3.title')} description={t('day3.how.to.use.stitch.step3.desc')} />
                    <Step num={4} title={t('day3.how.to.use.stitch.step4.title')} description={t('day3.how.to.use.stitch.step4.desc')} />
                    <Step num={5} title={t('day3.how.to.use.stitch.step5.title')} description={t('day3.how.to.use.stitch.step5.desc')} />
                    <Step num={6} title={t('day3.how.to.use.stitch.step6.title')} description={t('day3.how.to.use.stitch.step6.desc')} />
                    <Step num={7} title={t('day3.how.to.use.stitch.step7.title')} description={t('day3.how.to.use.stitch.step7.desc')} />
                    <Step num={8} title={t('day3.how.to.use.stitch.step8.title')} description={t('day3.how.to.use.stitch.step8.desc')} />
                </div>
            </section>

            <section className="bg-secondary p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-foreground text-center">{t('day3.important.tip.title')}</h3>
                <p className="mt-2 text-center text-muted-foreground">{t('day3.important.tip.desc')}</p>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-foreground text-center">{t('day3.writing.prompts.title')}</h2>
                <p className="mt-2 text-center max-w-2xl mx-auto text-muted-foreground">{t('day3.writing.prompts.desc')}</p>
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <TipCard title={t('day3.prompt.tip.specific.title')} description={t('day3.prompt.tip.specific.desc')} />
                    <TipCard title={t('day3.prompt.tip.structural.title')} description={t('day3.prompt.tip.structural.desc')} />
                    <TipCard title={t('day3.prompt.tip.technical.title')} description={t('day3.prompt.tip.technical.desc')} />
                    <TipCard title={t('day3.prompt.tip.practical.title')} description={t('day3.prompt.tip.practical.desc')} />
                </div>
            </section>

            <section>
                <h2 className="text-3xl font-bold text-foreground text-center">{t('day3.prompt.examples.title')}</h2>
                <p className="mt-2 text-center max-w-2xl mx-auto text-muted-foreground">{t('day3.prompt.examples.desc')}</p>
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <ExampleCard title={t('day3.example.landing.title')} content={t('day3.example.landing.content')} />
                    <ExampleCard title={t('day3.example.dashboard.title')} content={t('day3.example.dashboard.content')} />
                </div>
            </section>

            <section className="text-center bg-day3/10 p-6 rounded-lg border-2 border-dashed border-day3">
                <h2 className="text-2xl font-bold text-foreground">{t('day3.ready.to.start.title')}</h2>
                <p className="mt-2 text-muted-foreground">{t('day3.ready.to.start.desc')}</p>
                <button 
                    onClick={onGeneratePromptClick}
                    className="mt-4 inline-flex items-center gap-2 bg-day3 text-white font-bold py-3 px-6 rounded-md hover:opacity-90 transition-opacity shadow-lg"
                >
                    <Wand2 className="w-5 h-5" /> {t('day3.generate.ai.prompt.button')}
                </button>
            </section>
        </div>
    );
};

export default StitchGuide;
