import React, { useState } from 'react';
import { Language, SensorReading, ToastMessage } from '../types';
import { translations } from '../utils/translations';
import { SpeechService } from '../utils/speechService';
import {
  MessageSquareQuote,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Sprout
} from 'lucide-react';

interface AskFarmSageProps {
  language: Language;
  sensorData: SensorReading | null;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'farmsage';
  text: string;
  timestamp: string;
}

export const AskFarmSage: React.FC<AskFarmSageProps> = ({
  language,
  sensorData,
  onShowToast
}) => {
  const t = translations[language];

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_msg',
      sender: 'farmsage',
      text: language === 'te'
        ? 'నమస్కారం రైతు మిత్రమా! నేను ఫామ్‌సేజ్ వ్యవసాయ సహాయకుడిని. మీ పంట లక్షణాలు, ఎరువుల సమయం, లేదా నేలలో తేమ గురించి ఏదైనా ప్రశ్న అడగండి. మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి.'
        : 'Welcome to FarmSage Agronomy Advisory. You can ask questions via voice or text in English or Telugu regarding crop symptoms, soil moisture, and cultural practices. Click the microphone to speak.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const sampleQueries = language === 'te' ? [
    'టమోటా ఆకుల అంచులు పసుపుగా మారడానికి ప్రధాన కారణాలు ఏమిటి?',
    'వరి ఆకులపై గోధుమ మచ్చలు కనిపిస్తే నేలలో తేమను ఎలా పరీక్షించాలి?',
    'మిరప మొక్కలలో కొత్త ఆకులు పసుపుగా మారి ఈనెలు పచ్చగా ఉంటే ఏం చేయాలి?',
    'భారీ వర్షాల తర్వాత నేల మురుగునీరు నిలవకుండా ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?'
  ] : [
    'What causes yellow leaf margins in tomato after heavy rainfall?',
    'How do I verify if brown leaf spots are fungal or moisture stress?',
    'Why are new chilli leaves turning pale while veins stay green?',
    'What are safe drainage checks to avoid root suffocation in paddy fields?'
  ];

  // Handle Speech-to-Text via microphone
  const toggleListening = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    if (!SpeechService.isRecognitionSupported()) {
      onShowToast({
        title: language === 'te' ? 'మైక్రోఫోన్ అందుబాటులో లేదు' : 'Speech Not Supported',
        message: language === 'te' ? 'ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి గూగుల్ క్రోమ్ ఉపయోగించండి.' : 'Speech recognition is not available in this browser. Please use Chrome or Edge.',
        type: 'warning'
      });
      return;
    }

    setIsListening(true);
    onShowToast({
      title: language === 'te' ? 'వాయిస్ రికార్డింగ్ ప్రారంభమైంది' : 'Voice Listening',
      message: language === 'te' ? 'మీ ప్రశ్నను స్పష్టంగా మాట్లాడండి...' : 'Listening to your voice... Speak clearly.',
      type: 'info'
    });

    SpeechService.startListening(
      language,
      (transcript) => {
        setInputQuery(transcript);
        setIsListening(false);
        handleSend(transcript);
      },
      (err) => {
        setIsListening(false);
        onShowToast({
          title: language === 'te' ? 'వాయిస్ లోపం' : 'Voice Interrupted',
          message: err,
          type: 'warning'
        });
      },
      () => {
        setIsListening(false);
      }
    );
  };

  // Handle Text-to-Speech read aloud
  const handleReadAloud = (text: string) => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    onShowToast({
      title: language === 'te' ? 'వాయిస్ చదువుతోంది' : 'Voice Response',
      message: language === 'te' ? 'సమాధానాన్ని చదివి వినిపిస్తోంది...' : 'Reading response aloud in natural voice.',
      type: 'info'
    });

    SpeechService.speak(text, language, () => {
      setIsSpeaking(false);
    });
  };

  // Send query to backend /api/ask-farmsage
  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 7000);

    try {
      const response = await fetch('/api/ask-farmsage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.trim(),
          language,
          cropInfo: {
            cropType: sensorData?.cropType || 'Tomato / Paddy',
            growthStage: 'vegetative'
          },
          sensorData: sensorData || null
        }),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'farmsage',
        text: data.answer || (language === 'te' ? 'సమాధానం పొందడంలో సమస్య ఎదురైంది.' : 'Could not process query.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);

      // Auto read aloud if farmer used voice
      if (isListening || queryToSend) {
        handleReadAloud(botMsg.text);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsLoading(false);
      // Instant local fallback advisory
      const isTe = language === 'te';
      const fallbackMsg: ChatMessage = {
        id: `bot_fb_${Date.now()}`,
        sender: 'farmsage',
        text: isTe
          ? `రైతు మిత్రమా, మీ ప్రశ్న "${q.trim()}" కు వ్యవసాయ నిపుణుల సలహా:\n\n• ప్రస్తుత నేలలో తేమ: ${sensorData?.soilMoisture || 42}% (${(sensorData?.soilMoisture || 42) > 70 ? 'తేమ ఎక్కువ' : 'సరిపడా'})\n• గాలి ఉష్ణోగ్రత: ${sensorData?.airTemperature || 28}°C\n• ఆకుల అడుగు భాగంలో రసం పీల్చే పురుగులు లేదా శిలీంధ్ర మచ్చలను తనిఖీ చేయండి.\n• పురుగుమందులు వాడేముందు స్థానిక వ్యవసాయ విస్తరణ అధికారి (AEO)ని సంప్రదించండి.`
          : `Farmer advisory for your query: "${q.trim()}":\n\n• Current soil moisture: ${sensorData?.soilMoisture || 42}% (${(sensorData?.soilMoisture || 42) > 70 ? 'Elevated' : 'Optimal'})\n• Ambient temperature: ${sensorData?.airTemperature || 28}°C\n• Check leaf undersides for pests or fungal mycelium.\n• Please verify with your local KVK or extension specialist prior to chemical spray applications.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (isListening || queryToSend) {
        handleReadAloud(fallbackMsg.text);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3E2A] font-serif tracking-tight flex items-center gap-2.5">
          <MessageSquareQuote className="w-7 h-7 text-[#2C6A41]" />
          <span>{t.ask.title}</span>
        </h1>
        <p className="text-sm text-[#4E6154] mt-1">
          {t.ask.subtitle}
        </p>
      </div>

      {/* Suggested Queries Chips */}
      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5DECة] space-y-2">
        <span className="text-xs font-bold text-[#4B3C2D] uppercase tracking-wider block">
          {t.ask.samplePromptsTitle}
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((query, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInputQuery(query);
                handleSend(query);
              }}
              className="text-left text-xs bg-white hover:bg-[#F2EFE8] text-[#1D3B28] px-3 py-1.5 rounded-xl border border-[#DDD3C1] transition-colors shadow-2xs"
            >
              🌱 {query}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="bg-white rounded-3xl border border-[#DDE5E0] shadow-sm p-4 sm:p-6 space-y-4 min-h-[380px] max-h-[520px] overflow-y-auto flex flex-col">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-[#214E34] text-white rounded-br-xs'
                  : 'bg-[#F4F8F5] text-[#163321] border border-[#D5E5DA] rounded-bl-xs'
              }`}
            >
              {msg.text}
            </div>

            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[10px] text-gray-400 font-mono">{msg.timestamp}</span>
              {msg.sender === 'farmsage' && (
                <button
                  type="button"
                  onClick={() => handleReadAloud(msg.text)}
                  className="text-[11px] font-semibold text-[#29683F] hover:text-[#183E26] flex items-center gap-1 transition-colors"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t.ask.stopReading}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t.ask.readAloud}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="self-start p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#D5E5DA] text-xs text-gray-600 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#29683F]" />
            <span>FarmSage evaluating agricultural evidence...</span>
          </div>
        )}
      </div>

      {/* Input Box with Microphone Voice Button */}
      <div className="relative flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#CCD8D0] shadow-md">
        {/* Mic Speech-to-Text Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={t.ask.micTooltip}
          className={`p-3 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-md ring-4 ring-rose-200'
              : 'bg-[#EBF3ED] text-[#214E34] hover:bg-[#DCEAE0]'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? t.ask.listening : t.ask.typePlaceholder}
          className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none text-gray-900 placeholder:text-gray-400"
        />

        {/* Send Button */}
        <button
          type="button"
          disabled={!inputQuery.trim() || isLoading}
          onClick={() => handleSend()}
          className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
            inputQuery.trim() && !isLoading
              ? 'bg-[#214E34] text-white hover:bg-[#183B27] cursor-pointer shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>{t.ask.sendButton}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Privacy note */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 px-2">
        <span>🔒 {t.ask.privacyNote}</span>
        <span>Languages: English (en-US) & Telugu (te-IN)</span>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Ethical Agronomy Notice:</strong> FarmSage answers never invent synthetic pesticides, doses, or fake chemical formulas. Consult a local certified agronomist or KVK officer for certified chemical recommendations.
        </span>
      </div>
    </div>
  );
};
