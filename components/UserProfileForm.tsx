import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslations } from '../lib/i18n';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Language, UserProfile } from '../types';
import { Globe } from './lucide-react';
import { trackEvent } from '../lib/analytics';

const UserProfileForm: React.FC = () => {
    const { user, setUserProfile, language, setLanguage } = useAppContext();
    const t = useTranslations(language);
    
    const [name, setName] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [aiExperience, setAiExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const languages: { code: Language; name: string }[] = [
        { code: 'en', name: 'English' },
        { code: 'ko', name: '한국어' },
        { code: 'am', name: 'አማርኛ' },
    ];

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLanguage = e.target.value as Language;
        setLanguage(newLanguage);
        trackEvent('Language Changed', 'Authentication', newLanguage);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name || !affiliation) {
            setError('Please fill out all required fields.');
            return;
        }
        setIsLoading(true);
        setError(null);
        
        const newProfile: UserProfile = {
            uid: user.uid,
            name,
            affiliation,
            aiExperience,
            createdAt: Date.now(),
        };

        try {
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setUserProfile(newProfile);
            trackEvent('Profile Created', 'Authentication', `Experience: ${aiExperience}`);
        } catch (err) {
            setError('Failed to save profile. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="relative max-w-md w-full bg-card p-8 rounded-xl shadow-lg border border-border">
                <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            className="bg-transparent border-none text-foreground focus:ring-0 text-sm"
                            >
                            {languages.map(({ code, name }) => (
                                <option key={code} value={code}>
                                {name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground">{t('auth.complete.profile.title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('auth.complete.profile.desc')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">{t('auth.profile.name')}</label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
                        />
                    </div>
                     <div>
                        <label htmlFor="affiliation" className="block text-sm font-medium text-foreground">{t('auth.profile.affiliation')}</label>
                        <input
                            id="affiliation"
                            type="text"
                            required
                            value={affiliation}
                            onChange={(e) => setAffiliation(e.target.value)}
                            className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
                        />
                    </div>
                     <div>
                        <label htmlFor="aiExperience" className="block text-sm font-medium text-foreground">{t('auth.profile.ai_experience')}</label>
                        <select
                            id="aiExperience"
                            value={aiExperience}
                            onChange={(e) => setAiExperience(e.target.value as any)}
                            className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
                        >
                            <option value="beginner">{t('auth.profile.ai_experience.beginner')}</option>
                            <option value="intermediate">{t('auth.profile.ai_experience.intermediate')}</option>
                            <option value="advanced">{t('auth.profile.ai_experience.advanced')}</option>
                            <option value="expert">{t('auth.profile.ai_experience.expert')}</option>
                        </select>
                    </div>
                    
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-colors">
                            {isLoading ? t('loading') : t('auth.profile.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfileForm;