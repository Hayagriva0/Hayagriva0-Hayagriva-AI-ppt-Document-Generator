import React, { useState, useEffect } from 'react';
import { DocumentType, GeneratedContent, Slide, Page, ChartData, Template } from '../types';
import { HayagrivaLogo, PencilIcon } from './icons';
import SlideEditor from './SlideEditor';

interface PreviewProps {
  content: GeneratedContent | null;
  documentType: DocumentType;
  isLoading: boolean;
  error: string | null;
  statusText: string;
  generatedImages: Record<number, string>;
  editingSlideIndex: number | null;
  setEditingSlideIndex: (index: number | null) => void;
  onRegenerateSlide: (slideIndex: number, newPrompt: string, mediaRequest: 'image' | 'chart' | 'none') => Promise<void>;
  selectedTemplate: Template;
}

declare var Chart: any; // From Chart.js CDN

const ChartComponent: React.FC<{ chartData: ChartData; chartId: string, template: Template }> = ({ chartData, chartId, template }) => {
    const chartRef = React.useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (chartRef.current && chartData) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#cbd5e1' : template.colors.text;

            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: chartData.type,
                    data: {
                        labels: chartData.labels,
                        datasets: chartData.datasets.map(ds => ({
                            ...ds,
                            backgroundColor: ds.backgroundColor || [template.colors.primary, template.colors.accent, template.colors.secondary],
                            borderColor: template.colors.background,
                        })),
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: textColor } }
                        },
                        scales: {
                           x: { ticks: { color: textColor } },
                           y: { ticks: { color: textColor } }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chartData, template]);

    return <div className="relative h-64 md:h-80 w-full my-4"><canvas ref={chartRef} id={chartId}></canvas></div>;
};


const SlidePreview: React.FC<{ slide: Slide, image?: string, index: number, onEdit: (index: number) => void, template: Template }> = ({ slide, image, index, onEdit, template }) => (
  <div 
    className="slide-preview-item group relative w-full h-full aspect-video rounded-xl shadow-xl p-6 flex flex-col border transform hover:scale-[1.02] transition-transform duration-300 overflow-hidden"
    style={{ 
        backgroundColor: template.colors.background,
        borderColor: template.colors.secondary
    }}
  >
    <h3 
        className="text-xl md:text-2xl font-bold mb-4 truncate"
        style={{ color: template.colors.primary }}
    >
        {slide.title}
    </h3>
    {image && <img src={`data:image/jpeg;base64,${image}`} alt={slide.imagePrompt} className="w-full h-32 object-cover rounded-md mb-4 border dark:border-slate-700" style={{borderColor: template.colors.secondary}} />}
    {slide.chart && <ChartComponent chartData={slide.chart} chartId={`chart-${index}`} template={template} />}
    <ul 
        className="space-y-2 list-disc pl-5 text-sm md:text-base overflow-y-auto"
        style={{ color: template.colors.text }}
    >
      {slide.content.map((point, idx) => (
        <li key={idx}>{point}</li>
      ))}
    </ul>
    <div className="absolute bottom-4 right-5 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full" style={{ color: template.colors.secondary }}>{index + 1}</div>
    <button onClick={() => onEdit(index)} className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" aria-label="Edit slide">
        <PencilIcon className="w-5 h-5" />
    </button>
  </div>
);

const PagePreview: React.FC<{ page: Page, image?: string, index: number, template: Template }> = ({ page, image, index, template }) => (
  <div 
    className="page-preview-item w-full rounded-xl shadow-xl p-8 md:p-12 border mb-8"
    style={{
        backgroundColor: template.colors.background,
        borderColor: template.colors.secondary
    }}
  >
    <h2 
        className="text-3xl font-bold mb-6 pb-2"
        style={{ color: template.colors.primary, borderBottomColor: template.colors.secondary }}
    >
        {page.title}
    </h2>
    {image && <img src={`data:image/jpeg;base64,${image}`} alt={page.imagePrompt} className="w-full h-auto object-cover rounded-lg mb-6 border" style={{borderColor: template.colors.secondary}} />}
    {page.chart && <ChartComponent chartData={page.chart} chartId={`chart-${index}`} template={template} />}
    <div 
        className="space-y-4 leading-relaxed prose dark:prose-invert max-w-none"
        style={{ color: template.colors.text }}
    >
      {page.content.map((paragraph, idx) => (
        <p key={idx}>{paragraph}</p>
      ))}
    </div>
  </div>
);

const Preview: React.FC<PreviewProps> = ({ content, documentType, isLoading, error, statusText, generatedImages, editingSlideIndex, setEditingSlideIndex, onRegenerateSlide, selectedTemplate }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    // Reset to first slide when new content is generated
    if (content && content.length > 0) {
      setCurrentSlideIndex(0);
      setEditingSlideIndex(null);
    }
  }, [content]);

  if (isLoading && !content) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 p-4">
        <div className="text-center">
            <HayagrivaLogo className="w-20 h-20 text-blue-500 mx-auto animate-logo-pulse" />
            <p className="mt-4 text-lg font-semibold">{statusText || 'Generating your document...'}</p>
            <p className="text-sm">The AI is crafting your content, this may take a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-md text-center max-w-lg">
          <strong className="font-bold">An error occurred!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (!content || content.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 p-4">
        <div className="text-center p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl max-w-md border border-slate-200 dark:border-slate-800 shadow-sm">
            <HayagrivaLogo className="mx-auto w-16 h-16 mb-4 text-blue-600 dark:text-blue-500" />
            <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Welcome to Hayagriva</h2>
            <p className="text-slate-600 dark:text-slate-400">Describe your topic in the sidebar, choose a style, and let the AI create your document or presentation.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Made by Abhra</p>
        </div>
      </div>
    );
  }
  
  return (
    <div id="preview-container" className="w-full h-full">
      {documentType === DocumentType.PRESENTATION ? (
        <>
          <div className="interactive-view-wrapper w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
                <div className="w-full aspect-video shadow-2xl rounded-2xl overflow-hidden relative">
                   {editingSlideIndex === currentSlideIndex ? (
                       <SlideEditor 
                          slide={(content as Slide[])[currentSlideIndex]}
                          index={currentSlideIndex}
                          onSave={onRegenerateSlide}
                          onCancel={() => setEditingSlideIndex(null)}
                          isRegenerating={isLoading}
                       />
                   ) : (
                     (content as Slide[])[currentSlideIndex] && (
                        <SlidePreview 
                           slide={(content as Slide[])[currentSlideIndex]} 
                           image={generatedImages[currentSlideIndex]} 
                           index={currentSlideIndex} 
                           onEdit={setEditingSlideIndex}
                           template={selectedTemplate}
                        />
                     )
                   )}
                </div>
            </div>
            <div className="flex items-center justify-center p-4 space-x-6 text-slate-700 dark:text-slate-300">
              <button
                onClick={() => { setEditingSlideIndex(null); setCurrentSlideIndex(i => Math.max(0, i - 1)); }}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="font-semibold text-lg">{currentSlideIndex + 1} / {content.length}</span>
              <button
                onClick={() => { setEditingSlideIndex(null); setCurrentSlideIndex(i => Math.min(content.length - 1, i + 1)); }}
                disabled={currentSlideIndex === content.length - 1}
                className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          {/* Wrapper for grid view for PDF export. Hidden by default. */}
          <div className="pdf-export-grid-wrapper hidden">
            <div className="flex flex-col">
              {(content as Slide[]).map((slide, index) => (
                <SlidePreview key={`pdf-${index}`} slide={slide} image={generatedImages[index]} index={index} onEdit={() => {}} template={selectedTemplate} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto">
          {(content as Page[]).map((page, index) => (
            <PagePreview key={index} page={page} image={generatedImages[index]} index={index} template={selectedTemplate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Preview;