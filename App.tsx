import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Preview from './components/Preview';
import WelcomeScreen from './components/WelcomeScreen';
import { DocumentType, Theme, GeneratedContent, Slide, FontFamily, Template } from './types';
import { generateDocumentContent, generateImage, regenerateSlideContent } from './services/geminiService';
import { TEMPLATES } from './constants';
import { parseFile } from './utils/fileParser';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.PRESENTATION);
  const [slideCount, setSlideCount] = useState<number>(10);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [selectedFont, setSelectedFont] = useState<FontFamily>(TEMPLATES[0].font);
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileContext, setFileContext] = useState<string | null>(null);

  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleTemplateChange = (id: string) => {
    const newTemplate = TEMPLATES.find(t => t.id === id);
    if (newTemplate) {
      setSelectedTemplateId(id);
      setSelectedFont(newTemplate.font);
    }
  };

  const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);
    setFileContext(null);
    setIsLoading(true);
    setError(null);
    setStatusText(`Parsing ${file.name}...`);

    try {
        const text = await parseFile(file);
        setFileContext(text);
        setStatusText('Document parsed successfully.');
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to parse file: ${e.message}`);
        } else {
            setError('An unknown error occurred during file parsing.');
        }
        setAttachedFile(null); // Clear file on error
    } finally {
        setTimeout(() => setIsLoading(false), 1500);
    }
  };
    
  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileContext(null);
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGeneratedImages({});
    setEditingSlideIndex(null);

    try {
      setStatusText('Generating content...');
      const generationTemplate = { ...selectedTemplate, font: selectedFont };
      const content = await generateDocumentContent(prompt, documentType, generationTemplate, slideCount, fileContext);
      setGeneratedContent(content);

      const imagePrompts = content
        .map((item, index) => ({ prompt: item.imagePrompt, index }))
        .filter(item => item.prompt);

      if (imagePrompts.length > 0) {
        setStatusText(`Generating ${imagePrompts.length} image(s)...`);
        const imagePromises = imagePrompts.map(({ prompt, index }) =>
          generateImage(prompt!).then(imageData => ({ index, imageData }))
          .catch(err => {
              console.error(`Failed to generate image for item ${index}:`, err);
              return null;
          })
        );
        
        const results = await Promise.all(imagePromises);
        const newImages: Record<number, string> = {};
        results.forEach(result => {
            if(result) {
                newImages[result.index] = result.imageData;
            }
        });
        setGeneratedImages(newImages);
      }

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  const handleRegenerateSlide = async (slideIndex: number, newPrompt: string, mediaRequest: 'image' | 'chart' | 'none') => {
      if (!generatedContent) return;

      setIsLoading(true);
      setError(null);
      setStatusText(`Regenerating slide ${slideIndex + 1}...`);

      try {
          const newSlide = await regenerateSlideContent(prompt, newPrompt, mediaRequest);
          const newContent = [...generatedContent];
          newContent[slideIndex] = newSlide;
          setGeneratedContent(newContent as GeneratedContent);

          if (newSlide.imagePrompt) {
              setStatusText(`Generating new image for slide ${slideIndex + 1}...`);
              const newImageData = await generateImage(newSlide.imagePrompt);
              setGeneratedImages(prev => ({...prev, [slideIndex]: newImageData}));
          } else {
              setGeneratedImages(prev => {
                  const updated = {...prev};
                  delete updated[slideIndex];
                  return updated;
              });
          }
      } catch (e) {
          if (e instanceof Error) {
              setError(e.message);
          } else {
              setError('An unexpected error occurred during slide regeneration.');
          }
      } finally {
          setIsLoading(false);
          setStatusText('');
          setEditingSlideIndex(null);
      }
  };

  const bodyFontClass = {
    Inter: 'font-sans',
    Roboto: 'font-roboto',
    Lato: 'font-lato',
    Montserrat: 'font-montserrat',
    Poppins: 'font-poppins',
    Merriweather: 'font-merriweather',
    'Playfair Display': 'font-playfair-display',
    Raleway: 'font-raleway',
    Nunito: 'font-nunito',
  }[selectedFont];

  return (
    <div className={`w-screen h-screen ${bodyFontClass} text-slate-900 bg-slate-100 dark:text-slate-100 dark:bg-black transition-colors duration-300`}>
      <WelcomeScreen show={showWelcomeScreen} onDismiss={() => setShowWelcomeScreen(false)} />
      
      <div className={`w-full h-full flex flex-col md:flex-row overflow-hidden transition-opacity duration-500 ${showWelcomeScreen ? 'opacity-0' : 'opacity-100'}`}>
        <Sidebar
          prompt={prompt}
          setPrompt={setPrompt}
          documentType={documentType}
          setDocumentType={setDocumentType}
          slideCount={slideCount}
          setSlideCount={setSlideCount}
          theme={theme}
          setTheme={setTheme}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          statusText={statusText}
          generatedContent={generatedContent}
          generatedImages={generatedImages}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={handleTemplateChange}
          selectedFont={selectedFont}
          setSelectedFont={setSelectedFont}
          attachedFile={attachedFile}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
        />
        <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-900">
          <Preview
            content={generatedContent}
            documentType={documentType}
            isLoading={isLoading}
            error={error}
            statusText={statusText}
            generatedImages={generatedImages}
            editingSlideIndex={editingSlideIndex}
            setEditingSlideIndex={setEditingSlideIndex}
            onRegenerateSlide={handleRegenerateSlide}
            selectedTemplate={selectedTemplate}
          />
        </main>
      </div>
    </div>
  );
};

export default App;