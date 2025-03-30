/**
 * Hugging Face API client for Sesame CSM-1b text-to-speech model
 */

// You'll need to replace this with your actual Hugging Face API token
const HF_API_TOKEN = process.env.NEXT_PUBLIC_HF_API_TOKEN || '';

const API_URL = "https://api-inference.huggingface.co/models/sesame/csm-1b";

/**
 * Converts text to speech using the Sesame CSM-1b model via Hugging Face Inference API
 * 
 * @param text - The text to convert to speech
 * @returns Promise with audio data as ArrayBuffer
 */
export async function textToSpeech(text: string): Promise<ArrayBuffer> {
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

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(`API request failed: ${response.status} ${response.statusText} ${JSON.stringify(error)}`);
    }

    return await response.arrayBuffer();
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
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      audioContext.decodeAudioData(audioData, (buffer: AudioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          resolve();
        };
        
        source.start(0);
      }, (err: Error) => {
        reject(new Error(`Failed to decode audio data: ${err}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}
