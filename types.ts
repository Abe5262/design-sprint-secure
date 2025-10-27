// FIX: Define and export all necessary types to resolve import errors across the application.
export type Language = 'en' | 'ko' | 'am';

export interface UserProfile {
  uid: string;
  name: string;
  affiliation: string;
  aiExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  createdAt: number;
}

export interface BusinessIdea {
  title: string;
  description: string;
  sketchPrompt: string;
  sketchUrl: string | null;
}

export interface SketchStepDetails {
    layout: string;
    components: string[];
    interactions: string;
    visuals: string;
    tips: string;
}

export interface SketchStep {
    title: string;
    description: string;
    imagePrompt: string;
    details: SketchStepDetails;
    imageUrl: string | null;
}

export interface StoryboardPage {
    title: string;
    description: string;
    imagePrompt: string;
    imageUrl: string | null;
}

export interface StitchPrompt {
    title: string;
    description: string;
    optimizedPrompt: string;
}

export interface PageConfiguration {
    id: string;
    purpose: string;
    content: string;
    enabled: boolean;
}

export interface StitchPromptOptions {
    problem: string;
    solution: string;
    projectType: 'landing_page' | 'web_app' | 'ecommerce' | 'portfolio';
    uiLanguage: string;
    designStyle: string;
    colorPalette: string;
    layout: string;
    typography: string;
    components: string[];
    additionalRequirements: string;
    pages: PageConfiguration[];
}

export interface ProjectData {
    businessIdeas: BusinessIdea[];
    selectedIdea: BusinessIdea | null;
    threeStepSketches: { [key: string]: SketchStep[] } | null;
    selectedSketch: SketchStep[] | null;
    storyboards: { [key: string]: StoryboardPage[] } | null;
    selectedStoryboard: StoryboardPage[] | null;
    interviewQuestions: InterviewQuestion[];
    stitchPrompt: StitchPrompt | null;
}

export interface InterviewQuestion {
    category: string;
    question: string;
    intent: string;
    followUp: string[];
}

export interface KeyPattern {
    pattern: string;
    description: string;
    count: number;
}

export interface ActionItem {
    priority: 'High' | 'Medium' | 'Low';
    item: string;
    category: string;
}

export interface FeedbackAnalysisResult {
    summary: string;
    keyPatterns: KeyPattern[];
    insights: string[];
    actionItems: ActionItem[];
}

export interface InterviewRecord {
    id: string;
    content: string;
    timestamp: string;
    type: 'text' | 'audio';
    audioUrl?: string;
    audioBlob?: Blob;
}
