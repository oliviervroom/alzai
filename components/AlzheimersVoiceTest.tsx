import React, { useState, useEffect, useRef } from 'react';
import { textToSpeech, playAudio } from '@/lib/huggingFaceApi';

interface VoiceTestProps {
  onTestComplete: (score: number, answers: string[]) => void;
}

const AlzheimersVoiceTest: React.FC<VoiceTestProps> = ({ onTestComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testWords, setTestWords] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string[]>([
    "I'm going to say three words that I want you to remember. Please listen carefully.",
    "Now, I'd like you to recall the three words I just said.",
  ]);
  
  const recognitionRef = useRef<any>(null);
  
  // Word lists from Mini-Cog test
  const wordLists = [
    ["Banana", "Sunrise", "Chair"],
    ["Leader", "Season", "Table"],
    ["Village", "Kitchen", "Baby"],
    ["River", "Nation", "Finger"],
    ["Captain", "Garden", "Picture"],
    ["Daughter", "Heaven", "Mountain"]
  ];
  
  useEffect(() => {
    // Select a random word list
    const randomIndex = Math.floor(Math.random() * wordLists.length);
    setTestWords(wordLists[randomIndex]);
    
    // Initialize speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processUserResponse(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setErrorMessage(`Error: ${event.error}`);
      setIsListening(false);
    };

    // Clean up
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startTest = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Speak the initial instructions
      const instructionAudio = await textToSpeech(instructions[0]);
      await playAudio(instructionAudio);
      
      // Speak each word with a pause between
      for (const word of testWords) {
        const wordAudio = await textToSpeech(word);
        await playAudio(wordAudio);
        // Wait 1 second between words
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Move to recall step
      setCurrentStep(1);
      
      // Speak the recall instructions
      const recallAudio = await textToSpeech(instructions[1]);
      await playAudio(recallAudio);
      
      // Start listening for user's response
      startListening();
      
    } catch (error) {
      console.error('Error during test:', error);
      setErrorMessage(`Error during test: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setErrorMessage('Failed to start speech recognition. Please try again.');
    }
  };

  const processUserResponse = (transcript: string) => {
    // Store the user's response
    setUserAnswers([transcript]);
    
    // Calculate score based on word recall
    const words = transcript.toLowerCase().split(/\s+/);
    let score = 0;
    
    testWords.forEach(testWord => {
      if (words.some(word => word === testWord.toLowerCase())) {
        score++;
      }
    });
    
    // Complete the test
    onTestComplete(score, [transcript]);
  };

  return (
    <div className="voice-test p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Alzheimer's Voice Test</h2>
      
      {errorMessage && (
        <div className="error-message text-red-500 mb-4 p-3 bg-red-50 rounded">
          {errorMessage}
        </div>
      )}
      
      {currentStep === 0 && (
        <div className="start-test">
          <p className="mb-4">
            This test will assess your memory using voice interaction. You will hear three words and be asked to recall them.
          </p>
          <button
            onClick={startTest}
            disabled={isLoading}
            className={`px-6 py-3 rounded-full font-semibold text-white ${
              isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            {isLoading ? 'Starting Test...' : 'Start Test'}
          </button>
        </div>
      )}
      
      {currentStep === 1 && (
        <div className="recall-step">
          <p className="mb-4">
            Please recall the three words you just heard.
          </p>
          {isListening ? (
            <div className="listening-indicator flex items-center">
              <div className="animate-pulse mr-2 h-3 w-3 bg-red-500 rounded-full"></div>
              <p>Listening for your response...</p>
            </div>
          ) : (
            <button
              onClick={startListening}
              className="px-6 py-3 rounded-full font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              Speak Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AlzheimersVoiceTest;
