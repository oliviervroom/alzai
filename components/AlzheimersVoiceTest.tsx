import React, { useState, useEffect } from 'react';
import { speakWithFallback } from '@/lib/huggingFaceApi';

interface AlzheimersVoiceTestProps {
  onComplete?: (score: number, maxScore: number) => void;
}

const AlzheimersVoiceTest: React.FC<AlzheimersVoiceTestProps> = ({ onComplete }) => {
  // Test states
  const [testActive, setTestActive] = useState<boolean>(false);
  const [testPhase, setTestPhase] = useState<'intro' | 'wordPresentation' | 'distraction' | 'recall' | 'results'>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string>('This test will assess your memory using voice interaction. You will hear three words and be asked to recall them.');
  
  // Speech recognition
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Word lists for the test
  const wordLists = [
    ['Apple', 'Watch', 'Penny'],
    ['Banana', 'Sunset', 'Chair'],
    ['River', 'Nation', 'Finger'],
    ['Leader', 'Season', 'Table'],
    ['Village', 'Kitchen', 'Baby'],
    ['Mountain', 'Glasses', 'Paper']
  ];
  
  // Randomly select a word list for this test session
  const [selectedWordList] = useState<string[]>(() => {
    const randomIndex = Math.floor(Math.random() * wordLists.length);
    return wordLists[randomIndex];
  });
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Web Speech API types
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          processUserResponse(transcript);
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      } else {
        setError('Speech recognition is not supported in this browser.');
      }
    }
  }, []);
  
  // Process the user's spoken response
  const processUserResponse = (text: string) => {
    const lowerText = text.toLowerCase();
    const correctWords = selectedWordList.filter(word => 
      lowerText.includes(word.toLowerCase())
    );
    
    setScore(correctWords.length);
    
    if (testPhase === 'recall') {
      setTestPhase('results');
    }
  };
  
  // Start listening for user's spoken response
  const startListening = () => {
    if (recognition && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognition.start();
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };
  
  // Start the test
  const startTest = async () => {
    setTestActive(true);
    setTestPhase('wordPresentation');
    setCurrentWordIndex(0);
    setScore(0);
    setTranscript('');
    setError(null);
    
    try {
      // Introduce the test
      await speakWithFallback('I will say three words. Please listen carefully and remember them. You will be asked to recall these words later.');
      
      // Present each word with a pause between
      for (let i = 0; i < selectedWordList.length; i++) {
        setCurrentWordIndex(i);
        await speakWithFallback(selectedWordList[i]);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between words
      }
      
      // Distraction phase
      setTestPhase('distraction');
      await speakWithFallback('Now, please wait for a moment.');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second distraction period
      
      // Recall phase
      setTestPhase('recall');
      await speakWithFallback('Please repeat the three words I said earlier.');
      startListening();
      
    } catch (error) {
      console.error('Test execution error:', error);
      setError(`An error occurred during the test: ${error}`);
      setTestPhase('intro');
      setTestActive(false);
    }
  };
  
  // Reset the test
  const resetTest = () => {
    setTestActive(false);
    setTestPhase('intro');
    setCurrentWordIndex(0);
    setScore(0);
    setTranscript('');
    setError(null);
  };
  
  // Render test results
  const renderResults = () => {
    let interpretation = '';
    
    if (score === 3) {
      interpretation = 'Perfect score! Your word recall is excellent.';
    } else if (score === 2) {
      interpretation = 'Good job! Your word recall is within normal range.';
    } else if (score === 1) {
      interpretation = 'You recalled one word. This may indicate mild memory difficulties.';
    } else {
      interpretation = 'You did not recall any words. This may indicate significant memory difficulties.';
    }
    
    if (onComplete) {
      onComplete(score, 3);
    }
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Test Results</h3>
        <p className="mb-2">Words you were asked to remember: <span className="font-semibold">{selectedWordList.join(', ')}</span></p>
        <p className="mb-2">Your response: <span className="italic">"{transcript}"</span></p>
        <p className="mb-2">Words correctly recalled: <span className="font-semibold">{score} out of 3</span></p>
        <p className="mb-4">{interpretation}</p>
        <button 
          onClick={resetTest}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          Take Test Again
        </button>
      </div>
    );
  };
  
  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Alzheimer's Voice Test</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error during test: {error}</p>
        </div>
      )}
      
      {!testActive && testPhase === 'intro' && (
        <div>
          <p className="mb-4">{instructions}</p>
          <p className="mb-6">This test will assess your memory using voice interaction. You will hear three words and be asked to recall them.</p>
          <button 
            onClick={startTest}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
          >
            Start Test
          </button>
        </div>
      )}
      
      {testActive && testPhase === 'wordPresentation' && (
        <div>
          <p className="mb-4">Please listen carefully to these words:</p>
          <div className="flex justify-center items-center h-24 bg-blue-100 rounded-lg mb-4">
            <p className="text-xl font-semibold">{selectedWordList[currentWordIndex]}</p>
          </div>
          <p className="text-center text-gray-500">Word {currentWordIndex + 1} of 3</p>
        </div>
      )}
      
      {testActive && testPhase === 'distraction' && (
        <div>
          <p className="mb-4">Please wait a moment...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      {testActive && testPhase === 'recall' && (
        <div>
          <p className="mb-4">Please repeat the three words you heard earlier:</p>
          {isListening ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-red-500">🎤</span>
              </div>
              <p>Listening...</p>
              {transcript && <p className="mt-2 italic">"{transcript}"</p>}
            </div>
          ) : (
            <button 
              onClick={startListening}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              Start Speaking
            </button>
          )}
        </div>
      )}
      
      {testPhase === 'results' && renderResults()}
      
      <div className="mt-8 text-sm text-gray-500">
        <p>This application uses the Qwen2-Audio voice model via Hugging Face Inference API.</p>
        <p>© 2025 Voice Alzheimer's Test</p>
      </div>
    </div>
  );
};

export default AlzheimersVoiceTest;
