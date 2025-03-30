/**
 * Hugging Face API client for Sesame CSM-1b text-to-speech model
 */

// Check if the token is available and log a warning if it's not
const HF_API_TOKEN = process.env.NEXT_PUBLIC_HF_API_TOKEN || '';
if (!HF_API_TOKEN) {
  console.warn('NEXT_PUBLIC_HF_API_TOKEN is not set. API calls will fail.');
}

const API_URL = "https://api-inference.huggingface.co/models/sesame/csm-1b";

/**
 * Converts text to speech using the Sesame CSM-1b model via Hugging Face Inference API
 * 
 * @param text - The text to convert to speech
 * @returns Promise with audio data as ArrayBuffer
 */
export async function textToSpeech(text: string) : Promise<ArrayBuffer> {
  console.log('Calling Hugging Face API with text:', text);
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
        inputs: text,
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
    console.error('Error calling Hugging Face API:', error);
    throw error;
  }
}

/**
 * Plays audio from the Sesame CSM-1b model
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
 * Alternative TTS model in case Sesame CSM-1b is not working
 * Uses Facebook's MMS TTS model for English
 */
export async function fallbackTextToSpeech(text: string): Promise<ArrayBuffer> {
  console.log('Using fallback TTS model');
  const fallbackUrl = "https://api-inference.huggingface.co/models/facebook/mms-tts-eng";
  
  try {
    const response = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }) ,
    });

    console.log('Fallback API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `Status: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.text();
        console.error('Error response body:', errorData);
        errorMessage += ` - ${errorData}`;
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(`Fallback API request failed: ${errorMessage}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('Received fallback audio data of size:', arrayBuffer.byteLength);
    return arrayBuffer;
  } catch (error) {
    console.error('Error calling fallback API:', error);
    throw error;
  }
}
