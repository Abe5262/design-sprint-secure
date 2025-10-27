

import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslations } from '../../lib/i18n';
import { Language, InterviewRecord, FeedbackAnalysisResult } from '../../types';
import { analyzeInterviewFeedback } from '../../services/geminiService';
import { MessageSquare, Trash2, Wand2, Plus, Lightbulb, List, Check, UploadCloud } from '../lucide-react';
import { trackEvent } from '../../lib/analytics';

const FeedbackAnalysis: React.FC = () => {
    const { language, isLoading, setIsLoading, setError, error } = useAppContext();
    const t = useTranslations(language);

    const [interviewLanguage, setInterviewLanguage] = useState<Language>('en');
    const [currentContent, setCurrentContent] = useState('');
    const [records, setRecords] = useState<InterviewRecord[]>([]);
    const [analysisResult, setAnalysisResult] = useState<FeedbackAnalysisResult | null>(null);
    const [inputType, setInputType] = useState<'text' | 'audio'>('text');

    const examples = {
        en: `Host: "Hello! Today I'd like to talk about leather products. How do you usually purchase leather products?"
User: "Hello! I mainly buy online. Sometimes I go to department stores too."
Host: "Are there any difficulties when buying online?"
User: "Well... I can't actually see and touch them, so I don't know about the quality. Especially for leather, the texture is important."
Host: "What would you think if there was a service where you could customize leather products to your taste?"
User: "Wow, that sounds really great! Everything on the market is so similar... But would it really be made the way I want? I'm also curious about the quality."
Host: "You have concerns about quality. Are there any other worries?"
User: "Price is my biggest worry. Custom-made must be really expensive... And I'm also wondering how long I'd have to wait."`,
        ko: `진행자: "안녕하세요! 오늘 가죽 제품에 대해 이야기 나눠보고 싶어요. 보통 가죽 제품을 어떻게 구매하시나요?"
사용자: "안녕하세요! 주로 온라인으로 구매해요. 가끔 백화점도 가고요."
진행자: "온라인으로 구매할 때 어려운 점은 없으신가요?"
사용자: "음... 실제로 보고 만질 수 없으니까 품질을 잘 모르겠어요. 특히 가죽은 질감이 중요한데 말이죠."
진행자: "만약 취향에 맞게 가죽 제품을 맞춤 제작할 수 있는 서비스가 있다면 어떠실 것 같으세요?"
사용자: "와, 정말 좋을 것 같아요! 시중에 나와 있는 건 다 비슷비슷해서... 근데 정말 제가 원하는 대로 만들어질까요? 품질도 궁금하고요."
진행자: "품질에 대한 걱정이 있으시군요. 다른 걱정거리는 없으신가요?"
사용자: "가격이 제일 걱정돼요. 맞춤 제작은 분명 비쌀 텐데... 그리고 얼마나 기다려야 하는지도 궁금하고요."`
    }
    
    const handleAddTextRecord = () => {
        if (!currentContent.trim()) return;
        const newRecord: InterviewRecord = {
            id: Date.now().toString(),
            content: currentContent.trim(),
            timestamp: new Date().toISOString(),
            type: 'text',
        };
        setRecords([newRecord, ...records]);
        setCurrentContent('');
        trackEvent('Add Record', 'Day 2 - Feedback', 'Type: Text');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newRecords: InterviewRecord[] = Array.from(files).map((file: File) => {
            const audioUrl = URL.createObjectURL(file);
            return {
                id: `${Date.now()}-${file.name}`,
                content: file.name,
                timestamp: new Date().toISOString(),
                type: 'audio',
                audioUrl,
                audioBlob: file,
            };
        });
        
        setRecords(prev => [...newRecords, ...prev]);
        trackEvent('Add Record', 'Day 2 - Feedback', 'Type: Audio', files.length);
        
        event.target.value = ''; 
    };

    const handleDeleteRecord = (id: string) => {
        setRecords(records.filter(r => r.id !== id));
    };

    const handleAnalyze = async () => {
        const recordsToAnalyze = records.filter(r => r.type === inputType);
        if (recordsToAnalyze.length === 0) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        trackEvent('Analyze Feedback', 'Day 2 - Feedback', `Type: ${inputType}`, recordsToAnalyze.length);

        try {
            let preparedRecords;
            if (inputType === 'text') {
                preparedRecords = recordsToAnalyze.map(r => ({ type: 'text' as const, content: r.content }));
            } else {
                preparedRecords = recordsToAnalyze.filter(r => r.audioBlob).map(r => ({ type: 'audio' as const, blob: r.audioBlob! }));
            }
            
            if (preparedRecords.length === 0) {
                 setError(`No valid ${inputType} records to analyze.`);
                 setIsLoading(false);
                 return;
            }

            const result = await analyzeInterviewFeedback(preparedRecords, interviewLanguage);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    const priorityClasses = {
        High: 'bg-red-100 text-red-800 border-red-300',
        Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        Low: 'bg-green-100 text-green-800 border-green-300',
    };

    const displayedRecords = records.filter(r => r.type === inputType);

    const baseInputStyle = "p-2 mt-1 block w-full rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-ring sm:text-base";

    return (
        <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground">{t('day2.feedback.collection.title')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('day2.feedback.collection.desc')}</p>
                
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground">{t('day2.select.language')}</label>
                        <select
                            value={interviewLanguage}
                            onChange={(e) => setInterviewLanguage(e.target.value as Language)}
                            className={`${baseInputStyle} max-w-xs`}
                        >
                            <option value="en">English</option>
                            <option value="ko">한국어</option>
                            <option value="am">አማርኛ</option>
                        </select>
                    </div>
                    <div className="flex items-end justify-start sm:justify-end">
                        <div className="bg-secondary rounded-full p-1 flex self-end">
                            <button onClick={() => setInputType('text')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${inputType === 'text' ? 'bg-background shadow text-day2' : 'text-secondary-foreground'}`}>{t('day2.input.type.text')}</button>
                            <button onClick={() => setInputType('audio')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${inputType === 'audio' ? 'bg-background shadow text-day2' : 'text-secondary-foreground'}`}>{t('day2.input.type.audio')}</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                <h4 className="font-semibold text-foreground">{t('day2.input.records.title')}</h4>
                <p className="text-sm text-muted-foreground mt-1">{t('day2.input.records.desc')}</p>

                {inputType === 'text' && (
                    <>
                        <div className="my-4 p-3 bg-secondary rounded-md text-xs text-muted-foreground">
                            <p className="font-semibold">{t('day2.dialogue.format.title')}</p>
                            <p className="mt-1 whitespace-pre-wrap font-mono">{t('day2.dialogue.example1')}<br/>{t('day2.dialogue.example2')}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="interview-content" className="text-sm font-medium text-foreground flex justify-between">
                                    <span>{t('day2.interview.content.label')}</span>
                                    <button onClick={() => setCurrentContent(examples[language.substring(0, 2) as 'en' | 'ko'] || examples.en)} className="text-xs text-day2 hover:underline">{t('apply.example')}</button>
                                </label>
                                <textarea
                                    id="interview-content"
                                    rows={8}
                                    value={currentContent}
                                    onChange={(e) => setCurrentContent(e.target.value)}
                                    placeholder={t('day2.interview.content.placeholder')}
                                    className={baseInputStyle}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">{t('day2.multiple.interviews.tip')}</p>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleAddTextRecord} className="bg-day2 text-white font-semibold py-2 px-4 rounded-md hover:opacity-90 flex items-center gap-2">
                                <Plus className="w-4 h-4"/> {t('day2.add.record')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {inputType === 'audio' && (
                     <div className="mt-6 flex flex-col items-center justify-center space-y-4">
                        <div className="w-full p-4 bg-blue-50 rounded-md text-sm text-foreground border border-blue-200">
                            <h5 className="font-semibold text-blue-800">{t('day2.audio.recommendation.title')}</h5>
                            <p className="mt-1">{t('day2.audio.recommendation.content')}</p>
                        </div>
                        <label htmlFor="audio-upload" className="cursor-pointer mt-4 flex items-center justify-center gap-3 w-full sm:w-auto px-6 h-12 font-semibold rounded-md transition-all duration-300 ease-in-out bg-day2 text-white hover:opacity-90">
                            <UploadCloud className="w-5 h-5"/>
                            <span>{t('day2.upload.audio')}</span>
                        </label>
                        <input
                            id="audio-upload"
                            type="file"
                            multiple
                            accept="audio/mp3,audio/mpeg,audio/wav,audio/webm"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <p className="text-xs text-muted-foreground">{t('day2.upload.audio.prompt')}</p>
                    </div>
                )}
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground">{t('day2.feedback.collection.count')} ({displayedRecords.length})</h3>
                {displayedRecords.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {displayedRecords.map(record => (
                            <div key={record.id} className="bg-secondary p-4 rounded-md border border-border group">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow min-w-0">
                                        <p className="text-xs text-muted-foreground">{new Date(record.timestamp).toLocaleString()}</p>
                                        {record.type === 'text' ? (
                                             <p className="mt-1 text-sm text-secondary-foreground whitespace-pre-wrap">{record.content}</p>
                                        ) : (
                                            <>
                                            <p className="mt-1 text-sm font-semibold text-secondary-foreground">{record.content}</p>
                                            <audio src={record.audioUrl} controls className="w-full mt-2" />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                                        <button onClick={() => handleDeleteRecord(record.id)} className="text-muted-foreground hover:text-destructive p-1">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 text-center py-8 border-2 border-dashed border-border rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-foreground">{t('day2.no.records')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('day2.add.records.prompt')}</p>
                    </div>
                )}
                 <button onClick={handleAnalyze} disabled={isLoading || displayedRecords.length === 0} className="mt-6 w-full flex justify-center items-center gap-2 bg-day2 text-white font-bold py-2.5 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {isLoading ? t('loading') : <><Wand2 className="w-5 h-5"/> {t('day2.analyze.patterns')}</>}
                </button>
            </div>
            
             {(isLoading || analysisResult || (error && !error.includes('Microphone'))) && (
                 <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                    <h3 className="text-lg font-semibold text-foreground">{t('day2.analysis.results.title')}</h3>
                    {isLoading && <div className="mt-4 animate-pulse space-y-3"><div className="h-4 bg-secondary rounded w-full"></div><div className="h-4 bg-secondary rounded w-5/6"></div><div className="h-4 bg-secondary rounded w-3/4"></div></div>}
                    {error && <p className="mt-4 text-destructive text-sm">{error}</p>}
                    {analysisResult && (
                        <div className="mt-4 space-y-6">
                           <div>
                             <h4 className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-5 h-5 text-day2"/>{t('day2.summary')}</h4>
                             <p className="mt-2 text-sm text-secondary-foreground bg-green-50 p-4 rounded-md border border-green-200">{analysisResult.summary}</p>
                           </div>
                           <div>
                             <h4 className="font-semibold text-foreground flex items-center gap-2"><List className="w-5 h-5 text-day2"/>{t('day2.key.patterns')}</h4>
                             <div className="mt-2 space-y-2">
                               {analysisResult.keyPatterns.map((p, i) => (
                                <div key={i} className="p-3 bg-secondary rounded-md border border-border">
                                  <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm text-foreground">{p.pattern}</p>
                                    <span className="text-xs font-semibold bg-day2/10 text-day2 px-2 py-0.5 rounded-full">{p.count} {t('day2.times')}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-secondary-foreground">{p.description}</p>
                                </div>
                               ))}
                             </div>
                           </div>
                           <div>
                             <h4 className="font-semibold text-foreground flex items-center gap-2"><Lightbulb className="w-5 h-5 text-day2"/>{t('day2.key.insights')}</h4>
                             <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-secondary-foreground bg-blue-50 p-4 rounded-md border border-blue-200">
                               {analysisResult.insights.map((insight, i) => <li key={i}>{insight}</li>)}
                             </ul>
                           </div>
                           <div>
                             <h4 className="font-semibold text-foreground flex items-center gap-2"><Check className="w-5 h-5 text-day2"/>{t('day2.action.items')}</h4>
                              <div className="mt-2 space-y-2">
                                {analysisResult.actionItems.map((item, i) => (
                                    <div key={i} className={`p-3 rounded-md border ${priorityClasses[item.priority]}`}>
                                        <div className="flex items-start justify-between">
                                          <p className="text-sm font-medium pr-4">{item.item}</p>
                                          <span className="text-xs font-bold whitespace-nowrap">{item.priority}</span>
                                        </div>
                                        <p className="text-xs font-semibold mt-1 opacity-70">{item.category}</p>
                                    </div>
                                ))}
                              </div>
                           </div>
                        </div>
                    )}
                 </div>
            )}
             <div className="flex justify-between items-center pt-4">
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-accent text-sm font-semibold">{t('previous')}</button>
                <button className="px-4 py-2 bg-day2 text-white rounded-md hover:opacity-90 text-sm font-semibold">{t('complete.day2')}</button>
            </div>
        </div>
    );
};

export default FeedbackAnalysis;