import React, { useState, useEffect, useRef } from 'react';

interface VoiceInterfaceProps {
  onSpeechResult: (transcript: string) => void;
  onListeningChange: (isListening: boolean) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  onSpeechResult, 
  onListeningChange 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      onListeningChange(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      onListeningChange(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSpeechResult(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setErrorMessage(`Error: ${event.error}`);
      setIsListening(false);
      onListeningChange(false);
    };

    // Clean up
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onListeningChange, onSpeechResult]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setErrorMessage('Failed to start speech recognition. Please try again.');
      }
    }
  };

  return (
    <div className="voice-interface">
      {errorMessage && (
        <div className="error-message text-red-500 mb-4">
          {errorMessage}
        </div>
      )}
      <button
        onClick={toggleListening}
        className={`px-6 py-3 rounded-full font-semibold text-white ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } transition-colors`}
        disabled={!!errorMessage}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <div className="mt-2 text-sm text-gray-600">
        {isListening ? 'Listening...' : 'Click to start voice recognition'}
      </div>
    </div>
  );
};

export default VoiceInterface;
