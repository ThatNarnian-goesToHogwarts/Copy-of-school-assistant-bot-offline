
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Chat } from '@google/genai';
import { TranscriptMessage, KnowledgeBaseEntry } from '../types';
import { MicIcon, StopIcon, BotIcon, UserIcon, LoadingIcon } from './Icons';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { getKnowledgeBase } from '../utils/knowledgeBase';

const BASE_SYSTEM_INSTRUCTION = `You are a helpful and friendly humanoid robot assistant for a school. Your name is Bolt. You are designed to assist students, staff, and visitors. Use the following knowledge base to answer questions accurately. Be concise, friendly, and speak clearly.

**Instructions:**
- Only use the information provided in the knowledge base below to answer questions.
- If the answer is not in the knowledge base, you MUST respond with: "I'm afraid I cannot answer that. Please refer to the handbook or school website." Do not make up answers.
- If you cannot understand a question due to accents, a different language, or unclear speech, politely ask the user to repeat themselves or rephrase. For example, say "I'm sorry, I didn't quite get that. Could you please say it again?".

**Knowledge Base:**`;

interface ChatViewProps {
  isOnline: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ isOnline }) => {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const aiRef = useRef<GoogleGenAI | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any | null>(null); // Using 'any' for SpeechRecognition
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const stopAudioPlayback = useCallback(() => {
    if (outputAudioContextRef.current) {
        audioSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { /* ignore */ }
        });
        audioSourcesRef.current.clear();
    }
  }, []);
  
  // Initialization effect
  useEffect(() => {
    if (isOnline) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const knowledgeBase = getKnowledgeBase();
      const knowledgeBaseString = knowledgeBase.map(entry => `- **${entry.topic}:** ${entry.information}`).join('\n');
      const fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n${knowledgeBaseString}`;

      chatRef.current = aiRef.current.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: fullSystemInstruction },
      });
    }
    
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const queryText = lastResult[0].transcript;
          handleSendQuery(queryText);
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

    } else {
      setError("Speech recognition is not supported by your browser.");
      setInputMode('text');
    }

    return () => {
        stopAudioPlayback();
        if(recognitionRef.current) recognitionRef.current.abort();
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
    }
  }, [stopAudioPlayback, isOnline]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const speak = async (text: string) => {
    if (!aiRef.current || !outputAudioContextRef.current || text.trim().length === 0 || !isOnline) return;
    stopAudioPlayback();

    try {
        const response = await aiRef.current.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData && outputAudioContextRef.current) {
            const audioContext = outputAudioContextRef.current;
            const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => audioSourcesRef.current.delete(source);
            source.start(0);
            audioSourcesRef.current.add(source);
        }
    } catch(err) {
        console.error("TTS Error:", err);
        setError("Sorry, I couldn't generate audio for that response.");
    }
  };

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || isBotResponding) return;

    setError(null);
    setTranscript(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: queryText }]);
    setIsBotResponding(true);

    if (isOnline) {
        try {
            if (!chatRef.current) { // Re-initialize if connection was lost and regained
                const knowledgeBase = getKnowledgeBase();
                const knowledgeBaseString = knowledgeBase.map(entry => `- **${entry.topic}:** ${entry.information}`).join('\n');
                const fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n${knowledgeBaseString}`;
                chatRef.current = aiRef.current!.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction: fullSystemInstruction },
                });
            }

            const response = await chatRef.current?.sendMessage({ message: queryText });
            const botText = response?.text?.trim();

            if (botText) {
                setTranscript(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text: botText }]);
                await speak(botText);
            } else {
                throw new Error("Received an empty response.");
            }
        } catch (err) {
            console.error("Chat Error:", err);
            const errorMessage = "I'm having trouble connecting. Please check your internet connection and try again.";
            setError(errorMessage);
            setTranscript(prev => [...prev, { id: `bot-err-${Date.now()}`, sender: 'bot', text: errorMessage }]);
        } finally {
            setIsBotResponding(false);
        }
    } else { // Offline Logic
        const knowledgeBase = getKnowledgeBase();
        
        const findBestMatch = (query: string): KnowledgeBaseEntry | null => {
            const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            if (queryWords.length === 0) return null;
            let bestMatch: KnowledgeBaseEntry | null = null;
            let maxScore = 0;

            knowledgeBase.forEach(entry => {
                const topicText = entry.topic.toLowerCase();
                const infoText = entry.information.toLowerCase();
                let score = 0;
                queryWords.forEach(word => {
                    if (topicText.includes(word)) score += 3;
                    if (infoText.includes(word)) score += 1;
                });
                const wordsInTopic = queryWords.filter(w => topicText.includes(w)).length;
                if (wordsInTopic > 1) score += wordsInTopic * 2;
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = entry;
                }
            });
            return maxScore > 2 ? bestMatch : null;
        };

        const match = findBestMatch(queryText);
        setTimeout(() => {
            const botText = match 
              ? match.information 
              : "I'm sorry, I couldn't find an answer in my local knowledge base. Please connect to the internet for full conversational capabilities.";
            setTranscript(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text: botText }]);
            setIsBotResponding(false);
        }, 500);
    }
  };
  
  const handleMicClick = () => {
    // Allow trying to use speech recognition even when offline
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopAudioPlayback();
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(textInput);
    setTextInput('');
  };

  const renderMessage = (msg: TranscriptMessage) => (
      <div key={msg.id} className={`flex items-start gap-3 my-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        {msg.sender === 'bot' && (
            <div className="p-2 bg-blue-500 rounded-full flex-shrink-0 relative">
                <BotIcon className="w-6 h-6 text-white"/>
                {isBotResponding && transcript[transcript.length - 1]?.id === msg.id && (
                    <div className="absolute -bottom-1 -right-1"><LoadingIcon className="w-5 h-5"/></div>
                )}
            </div>
        )}
        <div className={`px-4 py-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
          <p className="text-white">{msg.text}</p>
        </div>
        {msg.sender === 'user' && <div className="p-2 bg-gray-600 rounded-full flex-shrink-0"><UserIcon className="w-6 h-6 text-white"/></div>}
      </div>
  );

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full h-full flex flex-col animate-fade-in relative">
      <div className="flex-grow bg-gray-900/50 rounded-lg p-4 mb-4 overflow-y-auto min-h-[300px] flex flex-col">
          {transcript.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center m-auto">
                  <BotIcon className="w-16 h-16 mb-4"/>
                  <p className="text-lg">I'm Bolt, your school assistant.</p>
                  {isOnline ? (
                      <p>Start a conversation by voice or text.</p>
                  ) : (
                      <p className="mt-2 p-2 bg-yellow-900/50 text-yellow-300 rounded-md">You are offline. I can only search the local knowledge base. Voice features are enabled for offline use if supported by your browser.</p>
                  )}
              </div>
          )}
          <div className='flex-grow'>
            {transcript.map(renderMessage)}
            {isBotResponding && transcript[transcript.length -1]?.sender === 'user' && (
                <div className="flex items-start gap-3 my-4 animate-fade-in justify-start">
                    <div className="p-2 bg-blue-500 rounded-full flex-shrink-0"><BotIcon className="w-6 h-6 text-white"/></div>
                    <div className="px-4 py-3 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg bg-gray-700 rounded-bl-none flex items-center">
                        <LoadingIcon className="w-5 h-5 mr-3"/>
                        <span className="text-gray-400">Thinking...</span>
                    </div>
                </div>
            )}
          </div>
          <div ref={transcriptEndRef} />
      </div>
      
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center bg-gray-700 p-1 rounded-full mb-4">
            <button onClick={() => setInputMode('voice')} className={`px-3 py-1 text-sm rounded-full transition-colors ${inputMode === 'voice' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Voice</button>
            <button onClick={() => setInputMode('text')} className={`px-3 py-1 text-sm rounded-full transition-colors ${inputMode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-300'}`} disabled={false}>Text</button>
        </div>

        {inputMode === 'voice' ? (
          <div className="flex flex-col items-center">
            <button
                onClick={handleMicClick}
                className={`rounded-full p-6 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400' : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400'}`}
                disabled={isBotResponding}
            >
              {isListening ? <StopIcon className="w-10 h-10" /> : <MicIcon className="w-10 h-10" />}
            </button>
            <p className="mt-3 text-sm text-gray-400 h-5">
              {isBotResponding ? 'Responding...' : (isListening ? 'Listening...' : 'Click the mic to speak')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="w-full max-w-lg flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isOnline ? "Type your message..." : "Search local knowledge base..."}
              disabled={isBotResponding}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white disabled:opacity-50"
            />
            <button type="submit" disabled={isBotResponding || !textInput.trim()} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        )}
        {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ChatView;
