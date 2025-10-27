import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, AuthError } from 'firebase/auth';
import { useAppContext } from '../contexts/AppContext';
import { useTranslations } from '../lib/i18n';
import { Language } from '../types';
import { Eye, EyeOff, Globe } from './lucide-react';
import { trackEvent } from '../lib/analytics';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { language, setLanguage } = useAppContext();
    const t = useTranslations(language);
    
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

    const handleAuthError = (error: AuthError) => {
        switch (error.code) {
            case 'auth/invalid-email':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'This email is already registered.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            default:
                return t('auth.error.default');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLocalError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                trackEvent('Login Success', 'Authentication');
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                trackEvent('Signup Success', 'Authentication');
            }
        } catch (error) {
            setLocalError(handleAuthError(error as AuthError));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setIsLoading(true);
        setLocalError(null);
        try {
            await signInAnonymously(auth);
            trackEvent('Anonymous Login Success', 'Authentication');
        } catch (error) {
            setLocalError(handleAuthError(error as AuthError));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="relative max-w-md w-full bg-card px-8 py-12 rounded-xl shadow-lg border border-border">
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
                    <h1 className="text-2xl font-bold text-foreground leading-snug">{t('app.title')}</h1>
                    <p className="text-muted-foreground mt-4">{isLogin ? t('auth.welcome') : t('auth.instructions')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">{t('auth.email')}</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
                        />
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-foreground">{t('auth.password')}</label>
                         <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                            {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                        </button>
                    </div>

                    {localError && <p className="text-sm text-destructive text-center">{localError}</p>}
                    
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-colors">
                            {isLoading ? t('loading') : (isLogin ? t('auth.login.button') : t('auth.signup.button'))}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-card text-muted-foreground">{t('auth.or')}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAnonymousLogin}
                        disabled={isLoading}
                        className="mt-4 w-full flex justify-center py-2.5 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-colors"
                    >
                        {t('auth.anonymous.button')}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setLocalError(null); }} className="text-sm font-semibold text-primary/80 hover:text-primary">
                        {isLogin ? t('auth.toggle.signup') : t('auth.toggle.login')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;