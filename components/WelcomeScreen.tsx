import React, { useEffect, useState } from 'react';
import { HayagrivaLogo, SparklesIcon, CheckCircleIcon } from './icons';

interface WelcomeScreenProps {
    show: boolean;
    onDismiss: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ show, onDismiss }) => {
    const [shouldRender, setShouldRender] = useState(show);

    useEffect(() => {
        if (show) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500); // Wait for fade-out transition
            return () => clearTimeout(timer);
        }
    }, [show]);
    
    if (!shouldRender) {
        return null;
    }

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100 dark:bg-black transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
        >
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-500 dark:from-blue-900 dark:via-teal-900 dark:to-indigo-900 animate-gradient-bg" style={{ backgroundSize: '400% 400%' }}></div>

            <div className="text-center p-8 max-w-2xl mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
                <HayagrivaLogo className="mx-auto w-20 h-20 mb-6 text-blue-600 dark:text-blue-500" />

                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
                    Welcome to Hayagriva
                </h1>

                <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
                    An open-source AI assistant that instantly creates professional presentations and documents from your ideas.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500"/>
                        <span>Completely Free</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500"/>
                        <span>No Sign-up Required</span>
                    </div>
                </div>
                
                <button
                    onClick={onDismiss}
                    className="group inline-flex items-center justify-center py-3 px-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-100 shadow-lg hover:shadow-xl"
                >
                    <SparklesIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-12"/>
                    Start Creating
                </button>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-12">
                    Made by Abhra
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;