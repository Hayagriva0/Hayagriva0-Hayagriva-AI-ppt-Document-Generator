import React from 'react';
import { DocumentType, Theme, GeneratedContent, Slide, Page, Template, FontFamily } from '../types';
import { PresentationIcon, DocumentIcon, SunIcon, MoonIcon, SparklesIcon, XCircleIcon, UploadIcon, HayagrivaLogo, PptxIcon, DocxIcon, PdfIcon } from './icons';
import { exportAsPPTX, exportAsDOCX, exportAsPDF } from '../services/exportService';
import { TEMPLATES, FONTS } from '../constants';

interface SidebarProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  documentType: DocumentType;
  setDocumentType: (type: DocumentType) => void;
  slideCount: number;
  setSlideCount: (count: number) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onGenerate: () => void;
  isLoading: boolean;
  statusText: string;
  generatedContent: GeneratedContent | null;
  generatedImages: Record<number, string>;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selectedFont: FontFamily;
  setSelectedFont: (font: FontFamily) => void;
  attachedFile: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  prompt,
  setPrompt,
  documentType,
  setDocumentType,
  slideCount,
  setSlideCount,
  theme,
  setTheme,
  onGenerate,
  isLoading,
  statusText,
  generatedContent,
  generatedImages,
  selectedTemplateId,
  setSelectedTemplateId,
  selectedFont,
  setSelectedFont,
  attachedFile,
  onFileChange,
  onRemoveFile,
}) => {
    
  const handleExport = async (format: 'pptx' | 'docx' | 'pdf') => {
    if (!generatedContent) return;

    if (format === 'pptx' && documentType === DocumentType.PRESENTATION) {
      exportAsPPTX(generatedContent as Slide[], generatedImages);
    } else if (format === 'docx' && documentType === DocumentType.DOCUMENT) {
      await exportAsDOCX(generatedContent as Page[], generatedImages);
    } else if (format === 'pdf') {
        const fileName = documentType === DocumentType.PRESENTATION ? 'presentation.pdf' : 'document.pdf';
        exportAsPDF(fileName, documentType);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
    
  return (
    <aside className="w-full md:w-[400px] h-full bg-slate-50 dark:bg-slate-950/50 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 space-y-6 overflow-y-auto">
      <header className="flex items-center justify-between">
         <div className="flex items-center space-x-2">
            <HayagrivaLogo className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Hayagriva</h1>
         </div>
         <button
            onClick={() => setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT)}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
         >
            {theme === Theme.LIGHT ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
         </button>
      </header>
      
      <div className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">Content</h2>
        <section className="space-y-3">
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A 5-slide summary of the attached report..."
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              aria-label="Document topic prompt"
            />
        </section>

        <section className="space-y-2">
             <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Document Context
                </label>
                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full">Alpha</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pb-1">
                This feature is experimental. Results may vary.
            </p>
            {attachedFile ? (
                <div className="flex items-center justify-between p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate pr-2" title={attachedFile.name}>{attachedFile.name}</span>
                    <button onClick={() => {
                        onRemoveFile();
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                    }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0" aria-label="Remove attached file">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        id="file-upload"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={onFileChange}
                        accept=".pdf,.pptx"
                    />
                    <label
                        htmlFor="file-upload"
                        className="w-full flex items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
                    >
                        <UploadIcon className="w-6 h-6 mr-2" />
                        <span className="text-sm font-semibold">Attach PDF or PPTX</span>
                    </label>
                </>
            )}
        </section>

        <section className="space-y-3 pt-2">
            <div className='bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex space-x-1'>
                 <button onClick={() => setDocumentType(DocumentType.PRESENTATION)}
                    className={`w-full py-2 px-3 text-sm font-semibold rounded-md transition-colors ${documentType === DocumentType.PRESENTATION ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                 >Presentation</button>
                 <button onClick={() => setDocumentType(DocumentType.DOCUMENT)}
                    className={`w-full py-2 px-3 text-sm font-semibold rounded-md transition-colors ${documentType === DocumentType.DOCUMENT ? 'bg-white dark:bg-slate-950 shadow-sm text-green-600' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                 >Document</button>
            </div>
            
            {documentType === DocumentType.PRESENTATION && (
              <div>
                <label htmlFor="slide-count-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Number of Slides
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    id="slide-count-select"
                    value={slideCount > 10 ? 'custom' : slideCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'custom') {
                        setSlideCount(12); // Default custom value
                      } else {
                        setSlideCount(parseInt(value, 10));
                      }
                    }}
                    className="flex-1 p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    aria-label="Number of slides selection"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  
                  {slideCount > 10 && (
                     <input
                        id="slide-count-custom"
                        type="number"
                        value={slideCount}
                        onChange={(e) => setSlideCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        min="11"
                        max="25"
                        className="w-24 p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        aria-label="Custom number of slides"
                      />
                  )}
                </div>
              </div>
            )}
        </section>
      </div>

      <div className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
         <h2 className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">Style</h2>
         <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Template</label>
            <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(template => (
                    <button key={template.id} onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-2.5 rounded-lg border-2 flex flex-col items-center transition-all ${selectedTemplateId === template.id ? 'border-blue-500 scale-105 shadow-md' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'}`}
                    aria-pressed={selectedTemplateId === template.id}>
                        <div className="w-full h-6 flex rounded-md overflow-hidden mb-2">
                            <div style={{ backgroundColor: template.colors.primary }} className="flex-1" />
                            <div style={{ backgroundColor: template.colors.secondary }} className="flex-1" />
                            <div style={{ backgroundColor: template.colors.accent }} className="flex-1" />
                            <div style={{ backgroundColor: template.colors.text }} className="flex-1" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{template.name}</span>
                    </button>
                ))}
            </div>
         </div>
         <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font</label>
            <div className="grid grid-cols-2 gap-2">
                {FONTS.map(font => (
                    <button key={font.id} onClick={() => setSelectedFont(font.id)}
                        className={`p-2 rounded-lg border text-sm transition-colors ${selectedFont === font.id ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 font-semibold' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 hover:border-blue-400'}`}>
                        {font.name}
                    </button>
                ))}
            </div>
         </div>
      </div>


      <div className="flex-grow"></div>
      
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onGenerate}
          disabled={isLoading || !prompt}
          className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-100 shadow-md hover:shadow-lg"
          aria-label="Generate document content"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{statusText || 'Generating...'}</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate
            </>
          )}
        </button>

        {generatedContent && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">Export</h3>
            <div className="grid grid-cols-3 gap-2">
              {documentType === DocumentType.PRESENTATION && (
                 <button onClick={() => handleExport('pptx')} className="w-full flex items-center justify-center py-2 px-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <PptxIcon className="w-5 h-5 mr-1.5 text-orange-500"/>
                    PPTX
                 </button>
              )}
              {documentType === DocumentType.DOCUMENT && (
                 <button onClick={() => handleExport('docx')} className="w-full flex items-center justify-center py-2 px-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <DocxIcon className="w-5 h-5 mr-1.5 text-sky-500"/>
                    DOCX
                    <span className="ml-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">Alpha</span>
                 </button>
              )}
              <button onClick={() => handleExport('pdf')} className={`w-full flex items-center justify-center py-2 px-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${documentType === DocumentType.PRESENTATION ? 'col-span-2' : 'col-span-2'}`}>
                    <PdfIcon className="w-5 h-5 mr-1.5 text-red-500"/>
                    PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;