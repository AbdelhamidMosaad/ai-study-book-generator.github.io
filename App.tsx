/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import StudyBookForm, { type FormData } from './components/StartScreen';
import LoadingScreen from './components/AdjustmentPanel';
import StudyBookDisplay from './components/FilterPanel';
import { generateStudyBook, type StudyBookResult } from './services/geminiService';

type AppState = 'form' | 'loading' | 'result' | 'error';
type Theme = 'light' | 'dark';

export interface SavedProject {
  title: string;
  timestamp: number;
  result: StudyBookResult;
  formData: FormData;
}

const Starfield: React.FC = () => (
    <div id="star-bg" className="hidden dark:block">
        <div id="stars1"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="shooting-stars">
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
        </div>
    </div>
);


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('form');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [result, setResult] = useState<StudyBookResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      // Load projects
      const savedProjectsJSON = localStorage.getItem('studyBookProjects');
      if (savedProjectsJSON) {
        setProjects(JSON.parse(savedProjectsJSON));
      }
      // Load theme
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const handleGenerate = useCallback(async (formData: FormData) => {
    setAppState('loading');
    setLoadingMessage('Initializing...');
    setError(null);
    setResult(null);

    try {
      const updateProgress = (message: string) => setLoadingMessage(message);
      const generatedData = await generateStudyBook(formData, updateProgress);
      
      setResult(generatedData);
      setAppState('result');

      // Save the new project
      const newProject: SavedProject = {
        title: `${formData.topic}: ${formData.subtopic}`,
        timestamp: Date.now(),
        result: generatedData,
        formData: formData,
      };

      setProjects(prevProjects => {
        const updatedProjects = [newProject, ...prevProjects].slice(0, 10);
        try {
          localStorage.setItem('studyBookProjects', JSON.stringify(updatedProjects));
        } catch (e) {
          console.error('Failed to save projects to localStorage:', e);
        }
        return updatedProjects;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(`Failed to generate study book. ${errorMessage}`);
      setAppState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState('form');
    setResult(null);
    setError(null);
    setLoadingMessage('');
  }, []);
  
  const handleSelectProject = useCallback((project: SavedProject) => {
    setResult(project.result);
    setAppState('result');
  }, []);

  const renderContent = () => {
    // FIX: Corrected typo from `appstate` to `appState`.
    switch (appState) {
      case 'loading':
        return <LoadingScreen message={loadingMessage} />;
      case 'result':
        return result && <StudyBookDisplay result={result} onReset={handleReset} />;
      case 'error':
        return (
          <div className="text-center animate-fade-in bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-600 dark:text-red-400">{error}</p>
            <button
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
      case 'form':
      default:
        return <StudyBookForm onGenerate={handleGenerate} recentProjects={projects} onSelectProject={handleSelectProject} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col">
      <Starfield />
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8 flex justify-center items-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;