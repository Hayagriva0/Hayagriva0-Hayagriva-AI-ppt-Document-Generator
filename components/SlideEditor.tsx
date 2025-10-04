import React, { useState } from 'react';
import { Slide } from '../types';
import { SparklesIcon } from './icons';

interface SlideEditorProps {
    slide: Slide;
    index: number;
    onSave: (slideIndex: number, newPrompt: string, mediaRequest: 'image' | 'chart' | 'none') => void;
    onCancel: () => void;
    isRegenerating: boolean;
}

const SlideEditor: React.FC<SlideEditorProps> = ({ slide, index, onSave, onCancel, isRegenerating }) => {
    const [prompt, setPrompt] = useState(`${slide.title}\n\n${slide.content.join('\n- ')}`);
    const [mediaRequest, setMediaRequest] = useState<'image' | 'chart' | 'none'>(slide.imagePrompt ? 'image' : slide.chart ? 'chart' : 'none');

    const handleSave = () => {
        if (prompt.trim()) {
            onSave(index, prompt, mediaRequest);
        }
    };
    
    return (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 p-6 flex flex-col z-10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Editing Slide {index + 1}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Rewrite the slide content below or provide new instructions for the AI.</p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="Enter new content or instructions for this slide..."
            />

            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Media Request</label>
                <div className="flex items-center space-x-4">
                    {(['none', 'image', 'chart'] as const).map(option => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`media-request-${index}`}
                                value={option}
                                checked={mediaRequest === option}
                                onChange={() => setMediaRequest(option)}
                                className="form-radio h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{option}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mt-auto flex justify-end space-x-3 pt-4">
                <button
                    onClick={onCancel}
                    className="py-2 px-4 bg-slate-200/80 text-slate-800 dark:bg-slate-700/80 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300/80 dark:hover:bg-slate-600/80 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isRegenerating || !prompt.trim()}
                    className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    {isRegenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-1.5" />
                            Regenerate Slide
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SlideEditor;
