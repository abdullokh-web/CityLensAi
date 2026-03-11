import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Info, ExternalLink, Sparkles, MapPin, MessageSquare, Send, Mic, MicOff, Loader2, Map as MapIcon, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { LandmarkAnalysis, LandmarkHistory, askQuestion, transcribeAudio, fetchLandmarkLocation, LandmarkLocation } from '../services/geminiService';
import { cn } from '../utils';

interface LandmarkDetailsProps {
  analysis: LandmarkAnalysis;
  history: LandmarkHistory;
  narration: string;
  audioBase64: string | null;
  imageSrc: string;
  onReset: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const LandmarkDetails: React.FC<LandmarkDetailsProps> = ({
  analysis,
  history,
  narration,
  audioBase64,
  imageSrc,
  onReset,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [landmarkLocation, setLandmarkLocation] = useState<LandmarkLocation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioBase64) {
      const audioBlob = b64toBlob(audioBase64, 'audio/wav');
      const url = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(url);
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);

      // Auto-play narration
      newAudio.play().then(() => setIsPlaying(true)).catch(console.error);

      return () => {
        newAudio.pause();
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBase64]);

  useEffect(() => {
    async function getMapData() {
      try {
        const data = await fetchLandmarkLocation(analysis.name, analysis.location);
        setLandmarkLocation(data);
      } catch (err) {
        console.error('Error fetching map data:', err);
      }
    }
    getMapData();
  }, [analysis]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAudio = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;
    
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askQuestion(text, history.history);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsTyping(true);
          try {
            const transcription = await transcribeAudio(base64, 'audio/webm');
            if (transcription) {
              handleSendMessage(transcription);
            }
          } catch (error) {
            console.error('Transcription error:', error);
          } finally {
            setIsTyping(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Mic error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Hero Image Section */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img
          src={imageSrc}
          alt={analysis.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* AR Overlay Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">AI Recognition Active</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">{analysis.name}</h1>
          <div className="flex items-center gap-1 text-zinc-400 text-sm">
            <MapPin size={14} />
            <span>{analysis.location}</span>
          </div>
        </motion.div>
      </div>

      <div className="px-6 -mt-4 relative z-10 space-y-8">
        {/* Narration Player */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">AI Narrator</h3>
              <p className="text-lg font-medium leading-relaxed italic text-zinc-200">
                "{narration}"
              </p>
            </div>
            <button
              onClick={toggleAudio}
              className={cn(
                "p-4 rounded-full transition-all active:scale-90",
                isPlaying ? "bg-emerald-500 text-black" : "bg-zinc-800 text-white"
              )}
            >
              {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              animate={{ width: isPlaying ? "100%" : "0%" }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 border border-white/10 rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
          >
            <MessageSquare size={20} />
            Ask a Question
          </button>
          <button
            onClick={() => setIsMapViewOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 border border-white/10 rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
          >
            <MapIcon size={20} />
            View Map
          </button>
        </div>

        {/* History Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Info size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">History & Significance</h2>
          </div>
          <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
            <Markdown>{history.history}</Markdown>
          </div>
        </section>

        {/* Fun Facts */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Did you know?</h2>
          <div className="grid gap-3">
            {history.funFacts.map((fact, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex gap-4"
              >
                <span className="text-emerald-500 font-bold">0{i + 1}</span>
                <p className="text-sm text-zinc-300">{fact}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sources */}
        {history.sources.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Sources</h2>
            <div className="flex flex-wrap gap-2">
              {history.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
                >
                  <ExternalLink size={12} />
                  {source.title}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Reset Button */}
        <div className="pt-8 pb-12">
          <button
            onClick={onReset}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-colors active:scale-95"
          >
            Explore Another Landmark
          </button>
        </div>
      </div>

      {/* Chat Bot Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-[32px] z-50 h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Ask CityLens AI</h2>
                  <p className="text-xs text-zinc-500">Professional Tour Guide Mode</p>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 bg-zinc-800 rounded-full text-zinc-400"
                >
                  <VolumeX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <MessageSquare size={48} />
                    <p className="text-sm max-w-[200px]">Ask me anything about {analysis.name}!</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                      )}
                    >
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none">
                      <Loader2 className="animate-spin text-emerald-500" size={16} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-zinc-900 border-t border-white/5">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your question..."
                      className="w-full bg-zinc-800 border-none rounded-2xl py-4 pl-6 pr-12 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      className={cn(
                        "absolute right-2 top-2 p-2 rounded-xl transition-colors",
                        isRecording ? "bg-red-500 text-white animate-pulse" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="p-4 bg-emerald-500 text-black rounded-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Map View Drawer */}
      <AnimatePresence>
        {isMapViewOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapViewOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-[32px] z-50 h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Landmark Location</h2>
                  <p className="text-xs text-zinc-500">{analysis.name}</p>
                </div>
                <button
                  onClick={() => setIsMapViewOpen(false)}
                  className="p-2 bg-zinc-800 rounded-full text-zinc-400"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="flex-1 relative bg-zinc-800">
                {analysis.lat && analysis.lng ? (
                  <iframe
                    title="Landmark Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${analysis.lat},${analysis.lng}&z=15&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                    <MapIcon size={48} className="text-zinc-600" />
                    <p className="text-zinc-400">Coordinates not available for this landmark.</p>
                  </div>
                )}
              </div>

              {landmarkLocation && (
                <div className="p-6 bg-zinc-900 border-t border-white/5">
                  <a
                    href={landmarkLocation.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 text-black rounded-2xl font-bold hover:bg-emerald-400 transition-colors"
                  >
                    <ExternalLink size={20} />
                    Open in Google Maps
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
