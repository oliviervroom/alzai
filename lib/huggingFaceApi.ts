/**
 * Hugging Face API client for Qwen2-Audio text-to-speech model
 */

// Check if the token is available and log a warning if it's not
const HF_API_TOKEN = process.env.NEXT_PUBLIC_HF_API_TOKEN || '';
if (!HF_API_TOKEN) {
  console.warn('NEXT_PUBLIC_HF_API_TOKEN is not set. API calls will fail.');
}

// Using Qwen2-Audio model instead of Sesame CSM
const API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2-Audio";

/**
 * Converts text to speech using the Qwen2-Audio model via Hugging Face Inference API
 * 
 * @param text - The text to convert to speech
 * @returns Promise with audio data as ArrayBuffer
 */
export async function textToSpeech(text: string) : Promise<ArrayBuffer> {
  console.log('Calling Qwen2-Audio API with text:', text);
  console.log('Using API URL:', API_URL);
  console.log('Token available:', !!HF_API_TOKEN);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          text: text,
          model: "qwen2-audio-1.5b", // You can also use "qwen2-audio-7b" for higher quality
          voice: "default"
        }
      }),
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `Status: ${response.status} ${response.statusText}`;
      
      try {
        // Try to get detailed error information
        const errorData = await response.text();
        console.error('Error response body:', errorData);
        
        try {
          // Try to parse as JSON if possible
          const jsonError = JSON.parse(errorData);
          errorMessage += ` - ${JSON.stringify(jsonError)}`;
        } catch {
          // If not JSON, use as text
          errorMessage += ` - ${errorData}`;
        }
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(`API request failed: ${errorMessage}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('Received audio data of size:', arrayBuffer.byteLength);
    return arrayBuffer;
  } catch (error) {
    console.error('Error calling Qwen2-Audio API:', error);
    throw error;
  }
}

/**
 * Plays audio from the Qwen2-Audio model
 * 
 * @param audioData - ArrayBuffer containing audio data
 * @returns Promise that resolves when audio playback is complete
 */
export function playAudio(audioData: ArrayBuffer): Promise<void> {
  console.log('Playing audio of size:', audioData.byteLength);
  
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      audioContext.decodeAudioData(audioData, (buffer: AudioBuffer) => {
        console.log('Audio decoded successfully. Duration:', buffer.duration);
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          console.log('Audio playback completed');
          resolve();
        };
        
        console.log('Starting audio playback');
        source.start(0);
      }, (err: Error) => {
        console.error('Failed to decode audio data:', err);
        reject(new Error(`Failed to decode audio data: ${err}`));
      });
    } catch (error) {
      console.error('Error in audio playback:', error);
      reject(error);
    }
  });
}

/**
 * Fallback to Web Speech API if Hugging Face API fails
 * 
 * @param text - The text to speak
 * @returns Promise that resolves when speech is complete
 */
export function webSpeechFallback(text: string): Promise<void> {
  console.log('Using Web Speech API fallback for text:', text);
  
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported in this browser"));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
      console.log('Web Speech API playback completed');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('Web Speech API error:', event);
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };
    
    console.log('Starting Web Speech API playback');
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Retry mechanism for text-to-speech with fallback to Web Speech API
 * 
 * @param text - The text to convert to speech
 * @param maxRetries - Maximum number of retries for Hugging Face API
 * @returns Promise that resolves when audio playback is complete
 */
export async function speakWithFallback(text: string, maxRetries = 2): Promise<void> {
  let lastError;
  
  // Try Qwen2-Audio API with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Qwen2-Audio attempt ${attempt} of ${maxRetries}`);
      const audioData = await textToSpeech(text);
      return await playAudio(audioData);
    } catch (error) {
      console.error(`Qwen2-Audio attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all Qwen2-Audio attempts failed, try Web Speech API
  console.log('All Qwen2-Audio attempts failed, trying Web Speech API fallback');
  try {
    return await webSpeechFallback(text);
  } catch (fallbackError) {
    console.error('Web Speech API fallback also failed:', fallbackError);
    
    // If both methods fail, throw the original error
    throw lastError || fallbackError;
  }
}
