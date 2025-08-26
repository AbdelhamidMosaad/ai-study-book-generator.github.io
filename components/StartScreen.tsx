/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { type SavedProject } from '../App';
import { HistoryIcon } from './icons';

export interface FormData {
  topic: string;
  subtopic: string;
  guide: string;
  references: string;
}

interface StudyBookFormProps {
  onGenerate: (formData: FormData) => void;
  recentProjects: SavedProject[];
  onSelectProject: (project: SavedProject) => void;
}

const StudyBookForm: React.FC<StudyBookFormProps> = ({ onGenerate, recentProjects, onSelectProject }) => {
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    subtopic: '',
    guide: '',
    references: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };
  
  const isFormValid = formData.topic.trim() !== '' && 
                      formData.subtopic.trim() !== '';

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="p-8 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl dark:backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">Create Your Study Book</h1>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
              Provide the details below and let AI craft a personalized study guide for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Topic*</label>
                  <input
                    type="text"
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    placeholder="e.g., Quantum Physics"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
              </div>
              <div>
                  <label htmlFor="subtopic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtopic*</label>
                  <input
                    type="text"
                    id="subtopic"
                    name="subtopic"
                    value={formData.subtopic}
                    onChange={handleChange}
                    placeholder="e.g., Quantum Entanglement"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
              </div>
          </div>

          <div>
              <label htmlFor="guide" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guiding Instructions</label>
              <textarea
                id="guide"
                name="guide"
                value={formData.guide}
                onChange={handleChange}
                rows={3}
                placeholder="e.g., Explain it for a beginner. Use analogies. Focus on the core concepts and historical context."
                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
          </div>
          
          <div>
              <label htmlFor="references" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">List of Books/Sources to Use as a Guide</label>
              <textarea
                id="references"
                name="references"
                value={formData.references}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., 'A Brief History of Time' by Stephen Hawking, 'The Elegant Universe' by Brian Greene"
                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none dark:disabled:from-blue-800 dark:disabled:to-blue-700"
          >
            Generate Study Book
          </button>
        </form>
      </div>

      {recentProjects.length > 0 && (
        <div className="mt-10 p-8 bg-white/70 dark:bg-gray-800/30 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-6 flex items-center justify-center gap-3">
            <HistoryIcon className="w-6 h-6" />
            Recent Projects
          </h2>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <button
                key={project.timestamp}
                onClick={() => onSelectProject(project)}
                className="w-full text-left p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/50 dark:hover:bg-gray-900/80 border border-gray-300 dark:border-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">{project.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created on: {new Date(project.timestamp).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyBookForm;