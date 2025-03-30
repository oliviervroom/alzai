'use client';

import React, { useState } from 'react';
import AlzheimersVoiceTest from '@/components/AlzheimersVoiceTest';

interface TestResult {
  score: number;
  answers: string[];
  timestamp: string;
}

export default function Home() {
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  
  const handleStartTest = () => {
    setTestStarted(true);
    setTestCompleted(false);
    setTestResults(null);
  };
  
  const handleTestComplete = (score: number, answers: string[]) => {
    const result: TestResult = {
      score,
      answers,
      timestamp: new Date().toLocaleString()
    };
    
    setTestResults(result);
    setTestCompleted(true);
  };
  
  const handleRestart = () => {
    setTestStarted(false);
    setTestCompleted(false);
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Voice Alzheimer's Test</h1>
        
        {!testStarted ? (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Welcome to the Voice Alzheimer's Test</h2>
            <p className="mb-6">
              This application administers a simple memory test using voice interaction.
              You will hear three words and then be asked to recall them.
            </p>
            <p className="mb-6">
              This test is based on the word recall portion of the Mini-Cog assessment,
              which is used as a quick screening tool for cognitive impairment.
            </p>
            <p className="mb-8 text-sm text-gray-600">
              Note: This is not a diagnostic tool. If you have concerns about memory or cognitive function,
              please consult with a healthcare professional.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleStartTest}
                className="px-6 py-3 rounded-full font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Start Test
              </button>
            </div>
          </div>
        ) : testCompleted ? (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Test Results</h2>
            {testResults && (
              <>
                <div className="mb-6">
                  <p className="text-lg mb-2">
                    <span className="font-semibold">Score:</span> {testResults.score} out of 3
                  </p>
                  <p className="text-lg mb-2">
                    <span className="font-semibold">Your response:</span> "{testResults.answers[0]}"
                  </p>
                  <p className="text-sm text-gray-600">
                    Completed at: {testResults.timestamp}
                  </p>
                </div>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Interpretation:</h3>
                  {testResults.score === 3 ? (
                    <p className="text-green-600">
                      Perfect recall! You remembered all three words correctly.
                    </p>
                  ) : testResults.score === 2 ? (
                    <p className="text-blue-600">
                      Good recall. You remembered two out of three words.
                    </p>
                  ) : testResults.score === 1 ? (
                    <p className="text-yellow-600">
                      Partial recall. You remembered one out of three words.
                    </p>
                  ) : (
                    <p className="text-red-600">
                      No words recalled. This may indicate a need for further assessment.
                    </p>
                  )}
                </div>
                
                <p className="mb-8 text-sm text-gray-600">
                  Remember: This is a simple screening test and not a diagnosis.
                  If you have concerns about memory, please consult a healthcare professional.
                </p>
              </>
            )}
            <div className="flex justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-full font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Take Test Again
              </button>
            </div>
          </div>
        ) : (
          <AlzheimersVoiceTest onTestComplete={handleTestComplete} />
        )}
      </div>
      
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>
          This application uses the Sesame CSM voice model via Hugging Face Inference API.
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} Voice Alzheimer's Test
        </p>
      </footer>
    </main>
  );
}
