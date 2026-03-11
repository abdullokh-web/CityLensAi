/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Camera, Upload, Map, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CameraView } from './components/CameraView';
import { LandmarkDetails } from './components/LandmarkDetails';
import { cn } from './utils';
import { 
  analyzeLandmark, 
  fetchLandmarkHistory, 
  generateNarration, 
  generateSpeech,
  LandmarkAnalysis,
  LandmarkHistory
} from './services/geminiService';

type AppState = 'landing' | 'camera' | 'processing' | 'result';

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LandmarkAnalysis | null>(null);
  const [history, setHistory] = useState<LandmarkHistory | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 'vision', label: 'Analyzing Image', sub: 'Identifying landmark with AI vision...' },
    { id: 'search', label: 'Historical Research', sub: 'Searching global databases for facts...' },
    { id: 'script', label: 'Scripting Tour', sub: 'Crafting your personalized narration...' },
    { id: 'voice', label: 'Voice Synthesis', sub: 'Generating high-quality audio guide...' }
  ];

  const handleCapture = async (base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setState('processing');
    setCurrentStep(0);
    
    try {
      setCurrentStep(0);
      const landmarkAnalysis = await analyzeLandmark(base64, 'image/jpeg');
      setAnalysis(landmarkAnalysis);

      setCurrentStep(1);
      const landmarkHistory = await fetchLandmarkHistory(landmarkAnalysis.name, landmarkAnalysis.location);
      setHistory(landmarkHistory);

      setCurrentStep(2);
      const tourNarration = await generateNarration(landmarkAnalysis.name, landmarkHistory.history);
      setNarration(tourNarration);

      setCurrentStep(3);
      const audio = await generateSpeech(tourNarration);
      setAudioBase64(audio);

      setState('result');
    } catch (error) {
      console.error('Processing error:', error);
      alert('Something went wrong while analyzing the photo. Please try again.');
      setState('landing');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        handleCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setState('landing');
    setImageSrc(null);
    setAnalysis(null);
    setHistory(null);
    setNarration(null);
    setAudioBase64(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-emerald-500/30">
      <AnimatePresence mode="wait">
        {state === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-md w-full text-center space-y-12">
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-emerald-400 text-sm font-medium"
                >
                  <Sparkles size={16} />
                  <span>AI-Powered Tourism</span>
                </motion.div>
                <h1 className="text-6xl font-bold tracking-tighter text-white">
                  CityLens <span className="text-emerald-500">AI</span>
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Turn your camera into a personal tour guide. Recognize landmarks instantly and hear their stories.
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setState('camera')}
                  className="group relative flex items-center justify-center gap-3 w-full py-5 bg-white text-black rounded-3xl font-bold text-xl hover:bg-zinc-200 transition-all active:scale-95"
                >
                  <Camera size={24} />
                  Take a Photo
                  <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <label className="flex items-center justify-center gap-3 w-full py-5 bg-zinc-900 text-white border border-white/10 rounded-3xl font-bold text-xl cursor-pointer hover:bg-zinc-800 transition-all active:scale-95">
                  <Upload size={24} />
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="flex justify-center gap-8 pt-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-zinc-900 rounded-2xl text-zinc-400">
                    <Map size={20} />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Global Coverage</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-zinc-900 rounded-2xl text-zinc-400">
                    <Sparkles size={20} />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">AI Insights</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'camera' && (
          <CameraView 
            key="camera" 
            onCapture={handleCapture} 
            onClose={() => setState('landing')} 
          />
        )}

        {state === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-8"
          >
            {/* Background Scanning Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <motion.div 
                className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="relative z-10 w-full max-w-sm space-y-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-3xl rotate-45" />
                  <motion.div
                    className="absolute inset-0 border-4 border-t-emerald-500 rounded-3xl rotate-45"
                    animate={{ rotate: 405 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="text-emerald-500" size={32} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Processing Discovery</h2>
                  <p className="text-zinc-500 text-sm mt-1">Our AI is building your personal tour</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <motion.div 
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="mt-1">
                        {isCompleted ? (
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-black rounded-full" 
                            />
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                            <motion.div 
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-2 h-2 bg-emerald-500 rounded-full" 
                            />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-zinc-800 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "text-sm font-bold transition-colors",
                          isActive ? "text-white" : isCompleted ? "text-emerald-500/60" : "text-zinc-700"
                        )}>
                          {step.label}
                        </h3>
                        {isActive && (
                          <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-xs text-zinc-500 mt-1"
                          >
                            {step.sub}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="pt-4">
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Step {currentStep + 1} of 4</span>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'result' && analysis && history && narration && imageSrc && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandmarkDetails
              analysis={analysis}
              history={history}
              narration={narration}
              audioBase64={audioBase64}
              imageSrc={imageSrc}
              onReset={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
