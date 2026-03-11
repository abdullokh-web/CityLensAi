# CityLens AI - Your Intelligent Personal Tour Guide

CityLens AI is a photo tourism application that transforms your smartphone into an intelligent personal tour guide. Using advanced AI vision and historical grounding, it recognizes landmarks instantly and provides narrated, interactive insights.

## 🌟 Key Features

- **Instant Landmark Recognition**: Uses `gemini-3.1-pro-preview` to identify landmarks from your camera or uploaded photos.
- **Live Search Grounding**: Fetches up-to-date historical facts, architectural details, and trivia using Google Search.
- **Narrated AR Experience**: Generates professional tour guide narration and converts it to high-quality speech using `gemini-2.5-flash-preview-tts`.
- **Interactive AI Chat**: Ask complex questions about any landmark. Powered by `gemini-3.1-pro-preview` with Thinking Mode for deep reasoning.
- **Voice Interaction**: Ask questions using your voice with real-time audio transcription.
- **Integrated Maps**: View the exact location of landmarks on an interactive map and get direct links to Google Maps.
- **Cinematic UI**: Features a depth-of-field camera effect, glassmorphism details, and a modern dark theme.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **AI Models**: 
  - `gemini-3.1-pro-preview` (Vision, Reasoning, Chat)
  - `gemini-3-flash-preview` (Search Grounding, Transcription)
  - `gemini-2.5-flash-preview-tts` (Speech Generation)
  - `gemini-2.5-flash` (Maps Grounding)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Environment Variables

Create a `.env` file in the root directory and add the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/citylens-ai.git
   cd citylens-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Usage

1. **Capture**: Point your camera at a landmark or upload a photo.
2. **Analyze**: Wait a few seconds while the AI identifies the location and researches its history.
3. **Explore**: 
   - Listen to the narrated story.
   - Read historical facts and "Did you know?" trivia.
   - Use the **Ask a Question** feature to dive deeper into specific details.
   - Use the **View Map** button to see the landmark's location.

## 📜 License

This project is licensed under the Apache-2.0 License.
