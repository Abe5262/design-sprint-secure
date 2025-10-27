import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Language, ProjectData, UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ToastContainer, ToastType } from '../components/Toast';

const initialProjectData: ProjectData = {
    businessIdeas: [],
    selectedIdea: null,
    threeStepSketches: null,
    selectedSketch: null,
    storyboards: null,
    selectedStoryboard: null,
    interviewQuestions: [],
    stitchPrompt: null,
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  projectData: ProjectData;
  updateProjectData: (updates: Partial<ProjectData>) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  user: User | null;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  lastSaved: Date | null;
  addToast: (message: string, type: ToastType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthLoading(true);
      setIsProfileLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Fetch user profile
        const profileRef = doc(db, 'users', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data() as UserProfile);
          // Fetch project data
          const projectRef = doc(db, 'projects', currentUser.uid);
          const projectSnap = await getDoc(projectRef);
          if (projectSnap.exists()) {
            setProjectData(projectSnap.data() as ProjectData);
          } else {
            setProjectData(initialProjectData);
          }
        } else {
          setUserProfile(null); // New user, needs to create profile
          setProjectData(initialProjectData);
        }
        setIsProfileLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setProjectData(initialProjectData);
        setIsProfileLoading(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const updateProjectData = async (updates: Partial<ProjectData>) => {
    if (!user) return;

    let updatedData: ProjectData | undefined;

    setProjectData(prevData => {
        updatedData = { ...prevData, ...updates };
        return updatedData;
    });

    try {
        if (updatedData) {
            const projectRef = doc(db, 'projects', user.uid);
            await setDoc(projectRef, updatedData, { merge: true });
            setLastSaved(new Date());
            addToast(
              language === 'ko' ? '저장되었습니다' :
              language === 'am' ? 'ተቀምጧል' :
              'Saved successfully',
              'success'
            );
        }
    } catch (e) {
        console.error("Error saving project data:", e);
        setError("Failed to save progress.");
        addToast(
          language === 'ko' ? '저장 실패' :
          language === 'am' ? 'ማስቀመጥ አልተሳካም' :
          'Failed to save',
          'error'
        );
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...userProfile, ...updates };
    setUserProfile(newProfile as UserProfile);
    try {
        const profileRef = doc(db, 'users', user.uid);
        await updateDoc(profileRef, updates);
        addToast(
          language === 'ko' ? '프로필이 업데이트되었습니다' :
          language === 'am' ? 'መገለጫ ተዘምኗል' :
          'Profile updated',
          'success'
        );
    } catch(e) {
        console.error("Error updating user profile:", e);
        setError("Failed to update profile.");
        addToast(
          language === 'ko' ? '프로필 업데이트 실패' :
          language === 'am' ? 'መገለጫ ማዘመን አልተሳካም' :
          'Failed to update profile',
          'error'
        );
    }
  };


  return (
    <AppContext.Provider value={{
        language, setLanguage,
        projectData, updateProjectData,
        isLoading, setIsLoading,
        error, setError,
        user, userProfile, setUserProfile, updateUserProfile,
        isAuthLoading, isProfileLoading,
        lastSaved, addToast
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};