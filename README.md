# Alzheimer's Voice Test Web Application

This web application provides a voice-based Alzheimer's test using the Sesame CSM voice model via Hugging Face Inference API. The application administers a simple memory test based on the word recall portion of the Mini-Cog assessment.

## Features

- Voice-based memory assessment
- Integration with Sesame CSM voice model via Hugging Face
- Simple user interface with clear instructions
- Immediate test results with interpretation
- Responsive design for all devices

## Technical Implementation

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Voice Model**: Sesame CSM-1b via Hugging Face Inference API
- **Speech Recognition**: Web Speech API (browser native)
- **Audio Playback**: Web Audio API

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd alzheimers-voice-test
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Hugging Face API token:
```
NEXT_PUBLIC_HF_API_TOKEN=your_hugging_face_api_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## How the Test Works

1. The user starts the test by clicking the "Start Test" button
2. The application uses the Sesame CSM voice model to speak three words
3. The user is then asked to recall these words
4. The Web Speech API captures the user's spoken response
5. The application scores the response based on how many words were correctly recalled
6. Results are displayed with an interpretation

## Customization

- Word lists can be modified in the `AlzheimersVoiceTest.tsx` component
- Test instructions can be changed in the same component
- Styling can be adjusted using Tailwind CSS classes

## Limitations

- Requires a browser that supports the Web Speech API (Chrome, Edge, Safari)
- Requires an internet connection to access the Hugging Face API
- The Hugging Face API may have rate limits depending on your account type

## Credits

- Sesame AI for the CSM voice model
- Hugging Face for hosting the model
- Mini-Cog for the cognitive assessment methodology
