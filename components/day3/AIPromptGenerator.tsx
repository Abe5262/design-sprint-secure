

import React, { useState, useEffect, useId } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslations } from '../../lib/i18n';
import { generateStitchPrompt } from '../../services/geminiService';
import { StitchPromptOptions, StitchPrompt, PageConfiguration } from '../../types';
import { Wand2, ClipboardCopy, Check, Sparkles, Plus, Trash2 } from '../lucide-react';
import { trackEvent } from '../../lib/analytics';

const AIPromptGenerator: React.FC = () => {
    const { language, projectData, updateProjectData, isLoading, setIsLoading, setError, error } = useAppContext();
    const t = useTranslations(language);
    const componentId = useId();

    const [formState, setFormState] = useState<StitchPromptOptions>({
        problem: '',
        solution: '',
        projectType: 'landing_page',
        uiLanguage: 'English',
        designStyle: 'modern_minimalist',
        colorPalette: 'blue_professional',
        layout: 'grid',
        typography: 'inter',
        components: ['hero_section', 'navigation_menu', 'contact_form'],
        additionalRequirements: '',
        pages: Array.from({ length: 5 }, (_, i) => ({
            id: `page-${i}`,
            purpose: `Page ${i + 1} Purpose`,
            content: `Page ${i + 1} Content`,
            enabled: true,
        }))
    });
    const [totalPages, setTotalPages] = useState(5);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (projectData.selectedIdea) {
            setFormState(prev => ({
                ...prev,
                problem: `Customers are having trouble finding our products easily.`,
                solution: `A website with intuitive product catalog and search functionality. (Based on: ${projectData.selectedIdea.title})`,
            }));
        }
    }, [projectData.selectedIdea]);
    
    useEffect(() => {
        setFormState(prev => {
            const currentPages = prev.pages;
            const diff = totalPages - currentPages.length;
            if (diff > 0) {
                const newPages = Array.from({ length: diff }, (_, i) => ({
                    id: `page-${currentPages.length + i}`,
                    purpose: `Page ${currentPages.length + i + 1} Purpose`,
                    content: `Page ${currentPages.length + i + 1} Content`,
                    enabled: true
                }));
                return { ...prev, pages: [...currentPages, ...newPages] };
            } else if (diff < 0) {
                return { ...prev, pages: currentPages.slice(0, totalPages) };
            }
            return prev;
        });
    }, [totalPages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSingleSelect = (field: keyof StitchPromptOptions, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };
    
    const handleMultiSelect = (value: string) => {
        setFormState(prev => {
            const currentComponents = prev.components;
            if (currentComponents.includes(value)) {
                return { ...prev, components: currentComponents.filter(c => c !== value) };
            } else {
                return { ...prev, components: [...currentComponents, value] };
            }
        });
    };
    
    const handlePageUpdate = (index: number, field: 'purpose' | 'content', value: string) => {
        setFormState(prev => {
            const newPages = [...prev.pages];
            newPages[index][field] = value;
            return { ...prev, pages: newPages };
        });
    };
    
    const handlePageToggle = (id: string) => {
        setFormState(prev => ({
            ...prev,
            pages: prev.pages.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
        }));
    };
    
    const removePage = (id: string) => {
        setFormState(prev => ({ ...prev, pages: prev.pages.filter(p => p.id !== id) }));
        setTotalPages(prev => prev - 1);
    };
    
    const addPage = () => {
        if (totalPages < 6) {
            setTotalPages(prev => prev + 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        await updateProjectData({ stitchPrompt: null });
        trackEvent('Generate Stitch Prompt', 'Day 3 - Prototyping', `Project Type: ${formState.projectType}`);
        try {
            const result = await generateStitchPrompt(formState, language);
            await updateProjectData({ stitchPrompt: result });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (projectData.stitchPrompt) {
            navigator.clipboard.writeText(projectData.stitchPrompt.optimizedPrompt);
            setCopied(true);
            trackEvent('Copy Prompt', 'Day 3 - Prototyping', `Title: ${projectData.stitchPrompt.title}`);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    // Data for options
    const uiLanguageOptions = [
        { id: 'Korean', titleKey: 'day3.form.uiLanguage.korean', descKey: 'day3.form.uiLanguage.korean.desc' },
        { id: 'English', titleKey: 'day3.form.uiLanguage.english', descKey: 'day3.form.uiLanguage.english.desc' },
        { id: 'Amharic', titleKey: 'day3.form.uiLanguage.amharic', descKey: 'day3.form.uiLanguage.amharic.desc' },
    ];
    const designStyleOptions = [
        { id: 'modern_minimalist', titleKey: 'day3.form.designStyle.modern_minimalist', descKey: 'day3.form.designStyle.modern_minimalist.desc' },
        { id: 'corporate_professional', titleKey: 'day3.form.designStyle.corporate_professional', descKey: 'day3.form.designStyle.corporate_professional.desc' },
        { id: 'creative_artistic', titleKey: 'day3.form.designStyle.creative_artistic', descKey: 'day3.form.designStyle.creative_artistic.desc' },
        { id: 'tech_startup', titleKey: 'day3.form.designStyle.tech_startup', descKey: 'day3.form.designStyle.tech_startup.desc' },
        { id: 'ecommerce_friendly', titleKey: 'day3.form.designStyle.ecommerce_friendly', descKey: 'day3.form.designStyle.ecommerce_friendly.desc' },
        { id: 'educational_clean', titleKey: 'day3.form.designStyle.educational_clean', descKey: 'day3.form.designStyle.educational_clean.desc' },
        { id: 'healthcare_trust', titleKey: 'day3.form.designStyle.healthcare_trust', descKey: 'day3.form.designStyle.healthcare_trust.desc' },
        { id: 'finance_secure', titleKey: 'day3.form.designStyle.finance_secure', descKey: 'day3.form.designStyle.finance_secure.desc' },
    ];
    const colorPaletteOptions = [
        { id: 'blue_professional', color: '#3b82f6', titleKey: 'day3.form.colorPalette.blue_professional', descKey: 'day3.form.colorPalette.blue_professional.desc' },
        { id: 'green_natural', color: '#22c55e', titleKey: 'day3.form.colorPalette.green_natural', descKey: 'day3.form.colorPalette.green_natural.desc' },
        { id: 'orange_energetic', color: '#f97316', titleKey: 'day3.form.colorPalette.orange_energetic', descKey: 'day3.form.colorPalette.orange_energetic.desc' },
        { id: 'purple_creative', color: '#8b5cf6', titleKey: 'day3.form.colorPalette.purple_creative', descKey: 'day3.form.colorPalette.purple_creative.desc' },
        { id: 'red_bold', color: '#ef4444', titleKey: 'day3.form.colorPalette.red_bold', descKey: 'day3.form.colorPalette.red_bold.desc' },
        { id: 'monochrome_classic', color: '#1f2937', titleKey: 'day3.form.colorPalette.monochrome_classic', descKey: 'day3.form.colorPalette.monochrome_classic.desc' },
        { id: 'earth_warm', color: '#a16207', titleKey: 'day3.form.colorPalette.earth_warm', descKey: 'day3.form.colorPalette.earth_warm.desc' },
        { id: 'pastel_soft', color: '#f472b6', titleKey: 'day3.form.colorPalette.pastel_soft', descKey: 'day3.form.colorPalette.pastel_soft.desc' },
    ];
    const layoutOptions = [
        { id: 'grid', titleKey: 'day3.form.layout.grid', descKey: 'day3.form.layout.grid.desc' },
        { id: 'card', titleKey: 'day3.form.layout.card', descKey: 'day3.form.layout.card.desc' },
        { id: 'full_width', titleKey: 'day3.form.layout.full_width', descKey: 'day3.form.layout.full_width.desc' },
        { id: 'sidebar_nav', titleKey: 'day3.form.layout.sidebar_nav', descKey: 'day3.form.layout.sidebar_nav.desc' },
        { id: 'header_nav', titleKey: 'day3.form.layout.header_nav', descKey: 'day3.form.layout.header_nav.desc' },
        { id: 'split_screen', titleKey: 'day3.form.layout.split_screen', descKey: 'day3.form.layout.split_screen.desc' },
        { id: 'magazine', titleKey: 'day3.form.layout.magazine', descKey: 'day3.form.layout.magazine.desc' },
        { id: 'dashboard', titleKey: 'day3.form.layout.dashboard', descKey: 'day3.form.layout.dashboard.desc' },
    ];
    const typographyOptions = [
        { id: 'inter', titleKey: 'day3.form.typography.inter', descKey: 'day3.form.typography.inter.desc' },
        { id: 'roboto', titleKey: 'day3.form.typography.roboto', descKey: 'day3.form.typography.roboto.desc' },
        { id: 'poppins', titleKey: 'day3.form.typography.poppins', descKey: 'day3.form.typography.poppins.desc' },
        { id: 'playfair', titleKey: 'day3.form.typography.playfair', descKey: 'day3.form.typography.playfair.desc' },
        { id: 'source_sans', titleKey: 'day3.form.typography.source_sans', descKey: 'day3.form.typography.source_sans.desc' },
        { id: 'montserrat', titleKey: 'day3.form.typography.montserrat', descKey: 'day3.form.typography.montserrat.desc' },
        { id: 'lato', titleKey: 'day3.form.typography.lato', descKey: 'day3.form.typography.lato.desc' },
        { id: 'open_sans', titleKey: 'day3.form.typography.open_sans', descKey: 'day3.form.typography.open_sans.desc' },
    ];
    const componentOptions = [
        { id: 'hero_section', titleKey: 'day3.form.components.hero_section', descKey: 'day3.form.components.hero_section.desc' },
        { id: 'navigation_menu', titleKey: 'day3.form.components.navigation_menu', descKey: 'day3.form.components.navigation_menu.desc' },
        { id: 'contact_form', titleKey: 'day3.form.components.contact_form', descKey: 'day3.form.components.contact_form.desc' },
        { id: 'testimonials', titleKey: 'day3.form.components.testimonials', descKey: 'day3.form.components.testimonials.desc' },
        { id: 'pricing_table', titleKey: 'day3.form.components.pricing_table', descKey: 'day3.form.components.pricing_table.desc' },
        { id: 'image_gallery', titleKey: 'day3.form.components.image_gallery', descKey: 'day3.form.components.image_gallery.desc' },
        { id: 'video_player', titleKey: 'day3.form.components.video_player', descKey: 'day3.form.components.video_player.desc' },
        { id: 'blog_posts', titleKey: 'day3.form.components.blog_posts', descKey: 'day3.form.components.blog_posts.desc' },
        { id: 'team_profiles', titleKey: 'day3.form.components.team_profiles', descKey: 'day3.form.components.team_profiles.desc' },
        { id: 'faq_section', titleKey: 'day3.form.components.faq_section', descKey: 'day3.form.components.faq_section.desc' },
        { id: 'newsletter_signup', titleKey: 'day3.form.components.newsletter_signup', descKey: 'day3.form.components.newsletter_signup.desc' },
        { id: 'social_links', titleKey: 'day3.form.components.social_links', descKey: 'day3.form.components.social_links.desc' },
        { id: 'search_bar', titleKey: 'day3.form.components.search_bar', descKey: 'day3.form.components.search_bar.desc' },
        { id: 'breadcrumbs', titleKey: 'day3.form.components.breadcrumbs', descKey: 'day3.form.components.breadcrumbs.desc' },
        { id: 'progress_indicators', titleKey: 'day3.form.components.progress_indicators', descKey: 'day3.form.components.progress_indicators.desc' },
        { id: 'modal_dialogs', titleKey: 'day3.form.components.modal_dialogs', descKey: 'day3.form.components.modal_dialogs.desc' },
        { id: 'tabs_accordions', titleKey: 'day3.form.components.tabs_accordions', descKey: 'day3.form.components.tabs_accordions.desc' },
        { id: 'data_tables', titleKey: 'day3.form.components.data_tables', descKey: 'day3.form.components.data_tables.desc' },
        { id: 'charts_graphs', titleKey: 'day3.form.components.charts_graphs', descKey: 'day3.form.components.charts_graphs.desc' },
        { id: 'file_upload', titleKey: 'day3.form.components.file_upload', descKey: 'day3.form.components.file_upload.desc' },
        { id: 'user_dashboard', titleKey: 'day3.form.components.user_dashboard', descKey: 'day3.form.components.user_dashboard.desc' },
        { id: 'shopping_cart', titleKey: 'day3.form.components.shopping_cart', descKey: 'day3.form.components.shopping_cart.desc' },
        { id: 'product_catalog', titleKey: 'day3.form.components.product_catalog', descKey: 'day3.form.components.product_catalog.desc' },
        { id: 'event_calendar', titleKey: 'day3.form.components.event_calendar', descKey: 'day3.form.components.event_calendar.desc' },
    ];
    
    // UI Components
    const StepCard: React.FC<{ title: string, children: React.ReactNode, examples?: React.ReactNode }> = ({ title, children, examples }) => (
      <div className="bg-card p-6 rounded-lg shadow-md border border-border">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-foreground">{title}</h3>
            {examples}
        </div>
        {children}
      </div>
    );
    
    const OptionGroup: React.FC<{ label: string, isMultiSelect?: boolean, children: React.ReactNode }> = ({ label, isMultiSelect = false, children }) => (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg text-foreground">{label}</h4>
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{isMultiSelect ? t('day3.multi.select') : t('day3.single.select')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {children}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="text-center bg-card p-6 rounded-lg shadow-md border border-border">
                <Sparkles className="mx-auto h-8 w-8 text-day3 mb-2" />
                <h2 className="text-3xl font-bold text-foreground">{t('day3.prompt.generator.title')}</h2>
                <p className="text-lg text-muted-foreground mt-1">{t('day3.prompt.generator.subtitle')}</p>
                <p className="text-base text-muted-foreground mt-2 max-w-2xl mx-auto">{t('day3.prompt.generator.desc')}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <StepCard title={t('day3.step1.basicInfo')} examples={
                        <div className="flex space-x-2">
                          <button type="button" className="text-xs font-semibold bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-accent">{t('example.1')}</button>
                          <button type="button" className="text-xs font-semibold bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-accent">{t('example.2')}</button>
                          <button type="button" className="text-xs font-semibold bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-accent">{t('example.3')}</button>
                        </div>
                    }>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground">{t('day3.form.problem.label')}</label>
                                <textarea name="problem" value={formState.problem} onChange={handleInputChange} rows={2} className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">{t('day3.form.solution.label')}</label>
                                <textarea name="solution" value={formState.solution} onChange={handleInputChange} rows={2} className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"/>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground">{t('day3.form.projectType.label')}</label>
                                    <select name="projectType" value={formState.projectType} onChange={handleInputChange} className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base">
                                        <option value="landing_page">{t('day3.form.projectType.option.landing')}</option>
                                        <option value="web_app">{t('day3.form.projectType.option.webapp')}</option>
                                        <option value="ecommerce">{t('day3.form.projectType.option.ecommerce')}</option>
                                        <option value="portfolio">{t('day3.form.projectType.option.portfolio')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground">{t('day3.form.additional.label')}</label>
                                    <input type="text" name="additionalRequirements" value={formState.additionalRequirements} onChange={handleInputChange} className="p-2 mt-1 block w-full rounded-md border-input bg-transparent shadow-sm focus:ring-2 focus:ring-ring sm:text-base"/>
                                </div>
                            </div>
                        </div>
                    </StepCard>

                    <StepCard title={t('day3.step2.designOptions')}>
                        <p className="text-base text-muted-foreground -mt-2 mb-6">{t('day3.step2.selectOptions')}</p>
                        <div className="space-y-6">
                            <OptionGroup label={t('day3.form.uiLanguage.label')}>
                                {uiLanguageOptions.map(opt => (
                                    <button type="button" key={opt.id} onClick={() => handleSingleSelect('uiLanguage', opt.id)} className={`p-3 text-left rounded-lg border-2 transition-all ${formState.uiLanguage === opt.id ? 'border-day3 bg-day3/10' : 'border-border bg-background hover:border-border/80'}`}>
                                        <p className="font-semibold text-sm text-foreground">{t(opt.titleKey as any)}</p>
                                        <p className="text-xs text-muted-foreground">{t(opt.descKey as any)}</p>
                                    </button>
                                ))}
                            </OptionGroup>
                            <OptionGroup label={t('day3.form.designStyle.label')}>
                               {designStyleOptions.map(opt => (
                                    <button type="button" key={opt.id} onClick={() => handleSingleSelect('designStyle', opt.id)} className={`p-3 text-left rounded-lg border-2 transition-all ${formState.designStyle === opt.id ? 'border-day3 bg-day3/10' : 'border-border bg-background hover:border-border/80'}`}>
                                        <p className="font-semibold text-sm text-foreground">{t(opt.titleKey as any)}</p>
                                        <p className="text-xs text-muted-foreground">{t(opt.descKey as any)}</p>
                                    </button>
                               ))}
                            </OptionGroup>
                            <OptionGroup label={t('day3.form.colorPalette.label')}>
                                {colorPaletteOptions.map(opt => (
                                    <button type="button" key={opt.id} onClick={() => handleSingleSelect('colorPalette', opt.id)} className={`p-3 text-left rounded-lg border-2 transition-all ${formState.colorPalette === opt.id ? 'border-day3 bg-day3/10' : 'border-border bg-background hover:border-border/80'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full" style={{backgroundColor: opt.color}}></span>
                                            <p className="font-semibold text-sm text-foreground">{t(opt.titleKey as any)}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{t(opt.descKey as any)}</p>
                                    </button>
                                ))}
                            </OptionGroup>
                             <OptionGroup label={t('day3.form.layout.label')}>
                                {layoutOptions.map(opt => (
                                    <button type="button" key={opt.id} onClick={() => handleSingleSelect('layout', opt.id)} className={`p-3 text-left rounded-lg border-2 transition-all ${formState.layout === opt.id ? 'border-day3 bg-day3/10' : 'border-border bg-background hover:border-border/80'}`}>
                                        <p className="font-semibold text-sm text-foreground">{t(opt.titleKey as any)}</p><p className="text-xs text-muted-foreground">{t(opt.descKey as any)}</p>
                                    </button>
                                ))}
                            </OptionGroup>
                            <OptionGroup label={t('day3.form.typography.label')}>
                                {typographyOptions.map(opt => (
                                    <button type="button" key={opt.id} onClick={() => handleSingleSelect('typography', opt.id)} className={`p-3 text-left rounded-lg border-2 transition-all ${formState.typography === opt.id ? 'border-day3 bg-day3/10' : 'border-border bg-background hover:border-border/80'}`}>
                                        <p className="font-semibold text-sm text-foreground">{t(opt.titleKey as any)}</p><p className="text-xs text-muted-foreground">{t(opt.descKey as any)}</p>
                                    </button>
                                ))}
                            </OptionGroup>
                             <OptionGroup label={t('day3.form.components.label')} isMultiSelect>
                                {componentOptions.map(opt => (
                                    <button type="button" key={opt.id} onClick={() => handleMultiSelect(opt.id)} className={`p-3 text-left rounded-lg border-2 transition-all ${formState.components.includes(opt.id) ? 'border-day3 bg-day3/10' : 'border-border bg-background hover:border-border/80'}`}>
                                        <p className="font-semibold text-sm text-foreground">{t(opt.titleKey as any)}</p><p className="text-xs text-muted-foreground">{t(opt.descKey as any)}</p>
                                    </button>
                                ))}
                            </OptionGroup>
                        </div>
                    </StepCard>
                    
                    <StepCard title={t('day3.step3.pageConfig')}>
                        <div className="space-y-4">
                            <div className="bg-day3/10 border-l-4 border-day3 p-3 rounded-r-md mb-4">
                                <p className="text-sm text-foreground font-medium">
                                    {language === 'ko' ? '🎯 Stitch는 한 번에 최대 6페이지까지 생성할 수 있습니다. 6페이지 생성 후, 다시 6페이지를 추가로 생성할 수 있습니다.' : language === 'am' ? '🎯 Stitch በአንድ ጊዜ እስከ 6 ገጾች ድረስ ማመንጨት ይችላል። 6 ገጾችን ካመነጩ በኋላ ተጨማሪ 6 ገጾችን ማመንጨት ይችላሉ።' : '🎯 Stitch can generate up to 6 pages at a time. After generating 6 pages, you can generate an additional 6 pages.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label htmlFor="total-pages" className="text-sm font-medium text-foreground whitespace-nowrap">{t('day3.form.pageConfig.total')}: {totalPages}</label>
                                <input id="total-pages" type="range" min="1" max="6" value={totalPages} onChange={(e) => setTotalPages(parseInt(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-day3" />
                            </div>
                             <div className="space-y-4">
                                {formState.pages.map((page, index) => (
                                <div key={page.id} className="bg-secondary p-4 rounded-lg border-border relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-secondary-foreground">{t('day3.form.page.label')} {index + 1}</h5>
                                        <div className="flex items-center gap-2">
                                            <label htmlFor={`${componentId}-${page.id}-enabled`} className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" id={`${componentId}-${page.id}-enabled`} className="sr-only" checked={page.enabled} onChange={() => handlePageToggle(page.id)} />
                                                    <div className={`block w-10 h-6 rounded-full ${page.enabled ? 'bg-day3' : 'bg-gray-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${page.enabled ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>
                                            <button type="button" onClick={() => removePage(page.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className={`grid md:grid-cols-2 gap-3 transition-opacity ${!page.enabled && 'opacity-50 pointer-events-none'}`}>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">{t('day3.form.pageConfig.purpose')}</label>
                                            <textarea value={page.purpose} onChange={(e) => handlePageUpdate(index, 'purpose', e.target.value)} rows={2} className="p-2 mt-1 block w-full text-sm rounded-md border-input bg-background shadow-sm focus:ring-2 focus:ring-ring"/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">{t('day3.form.pageConfig.content')}</label>
                                            <textarea value={page.content} onChange={(e) => handlePageUpdate(index, 'content', e.target.value)} rows={2} className="p-2 mt-1 block w-full text-sm rounded-md border-input bg-background shadow-sm focus:ring-2 focus:ring-ring"/>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addPage}
                                disabled={totalPages >= 6}
                                className="w-full text-sm font-semibold text-day3 bg-day3/10 border-2 border-dashed border-day3/30 py-2 rounded-lg hover:bg-day3/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4"/> {t('day3.form.pageConfig.add')} {totalPages >= 6 && language === 'ko' ? '(최대 6개)' : totalPages >= 6 && language === 'am' ? '(ከፍተኛ 6)' : totalPages >= 6 ? '(Max 6)' : ''}
                            </button>
                        </div>
                    </StepCard>

                    <StepCard title={t('day3.step4.generate')}>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg">
                            {isLoading ? t('loading') : <><Wand2 className="w-5 h-5"/> {t('day3.generate.prompt.button')}</>}
                        </button>
                    </StepCard>
                </div>
            </form>

            {(isLoading || projectData.stitchPrompt || error) && (
                <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                    <h3 className="text-2xl font-bold text-foreground">{t('day3.generated.prompt.title')}</h3>
                    {isLoading && (
                        <div className="mt-4 animate-pulse space-y-3">
                            <div className="h-4 bg-secondary rounded w-1/3"></div>
                            <div className="h-4 bg-secondary rounded w-full"></div>
                            <div className="h-4 bg-secondary rounded w-full"></div>
                            <div className="h-4 bg-secondary rounded w-5/6"></div>
                        </div>
                    )}
                    {error && <p className="mt-4 text-destructive text-sm">{error}</p>}
                    {projectData.stitchPrompt && (
                        <div className="mt-4 p-4 bg-secondary/50 border border-border rounded-md text-sm text-foreground space-y-3">
                            <h4 className="font-sans font-bold text-lg">{projectData.stitchPrompt.title}</h4>
                            <p className="font-sans text-muted-foreground">{projectData.stitchPrompt.description}</p>
                            <div className="whitespace-pre-wrap bg-background p-3 rounded border border-border font-mono text-sm">{projectData.stitchPrompt.optimizedPrompt}</div>
                            <button onClick={handleCopy} className="w-full flex justify-center items-center gap-2 bg-background text-day3 border-2 border-day3 font-semibold py-2 px-4 rounded-md hover:bg-accent transition-colors text-sm">
                                {copied ? <><Check className="w-4 h-4 text-green-500"/>{t('day3.prompt.copied')}</> : <><ClipboardCopy className="w-4 h-4"/>{t('day3.copy.prompt')}</>}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIPromptGenerator;