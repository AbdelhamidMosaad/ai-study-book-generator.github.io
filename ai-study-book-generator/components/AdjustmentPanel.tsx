/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Spinner from './Spinner';

interface LoadingScreenProps {
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-6 text-center animate-fade-in">
      <Spinner />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Generating Your Study Book...</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 min-h-[2.25rem]">{message}</p>
    </div>
  );
};

export default LoadingScreen;