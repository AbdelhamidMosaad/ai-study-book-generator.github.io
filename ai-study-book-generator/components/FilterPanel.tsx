/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect } from 'react';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { type StudyBookResult } from '../services/geminiService';
import { DownloadIcon, RestartIcon } from './icons';
import Spinner from './Spinner';

interface StudyBookDisplayProps {
  result: StudyBookResult;
  onReset: () => void;
}

const StudyBookDisplay: React.FC<StudyBookDisplayProps> = ({ result, onReset }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  
  useEffect(() => {
    if (result.content) {
      // Configure marked to handle markdown
      const renderer = new marked.Renderer();
      marked.setOptions({
        renderer,
        gfm: true,
        breaks: true,
      });
      const rawHtml = marked.parse(result.content) as string;
      setHtmlContent(rawHtml);
    }
  }, [result.content]);

  const handleDownloadPdf = async () => {
    const contentElement = contentRef.current;
    if (!contentElement || downloadingPdf) return;

    setDownloadingPdf(true);

    // 1. Clone the element to avoid changing the live view
    const clone = contentElement.cloneNode(true) as HTMLElement;

    // 2. Prepare the clone for PDF export (light theme)
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = `${contentElement.offsetWidth}px`;
    clone.style.backgroundColor = 'white';
    
    // Switch to light-mode prose for PDF
    const proseEl = clone.querySelector('.prose');
    if (proseEl) {
        proseEl.classList.remove('dark:prose-invert');
    }
    document.body.appendChild(clone);

    try {
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pageWidth;
        const imgHeight = canvasHeight / ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = -(imgHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save('study-book.pdf');

    } catch (err) {
        console.error("Error generating PDF:", err);
    } finally {
        document.body.removeChild(clone);
        setDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-100/80 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-xl sticky top-24 z-40 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Study Book is Ready!</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-rose-800 disabled:cursor-wait min-w-[190px]"
          >
            {downloadingPdf ? (
                <>
                    <Spinner className="w-5 h-5" />
                    <span>Downloading...</span>
                </>
            ) : (
                <>
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download as PDF</span>
                </>
            )}
          </button>
          <button
            onClick={onReset}
            disabled={downloadingPdf}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <RestartIcon className="w-5 h-5" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      <div ref={contentRef} className="bg-white dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 p-8 sm:p-12 rounded-2xl shadow-lg">
        <div 
          className="prose prose-lg max-w-none prose-h1:text-4xl prose-h1:font-extrabold prose-h2:text-3xl prose-h2:border-b prose-h2:border-gray-300 dark:prose-h2:border-gray-600 prose-h2:pb-2 prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-strong:text-gray-800 dark:prose-strong:text-gray-200 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>
    </div>
  );
};

export default StudyBookDisplay;