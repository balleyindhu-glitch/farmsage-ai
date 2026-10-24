import React, { useState } from 'react';
import { Language, SensorReading, ToastMessage } from '../types';
import { translations } from '../utils/translations';
import { SpeechService } from '../utils/speechService';
import {
  Settings,
  Languages,
  KeyRound,
  Terminal,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  sensorData: SensorReading | null;
  onSimulateSensor: () => void;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onToggleLanguage,
  sensorData,
  onSimulateSensor,
  onShowToast
}) => {
  const t = translations[language];
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [gatewayKey, setGatewayKey] = useState('');

  const displayKey = gatewayKey.trim() || 'YOUR_FARMSAGE_API_KEY';

  const curlExample = `curl -X POST "${window.location.origin}/api/sensor-data" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${displayKey}" \\
  -d '{
    "fieldId": "North-Block-4",
    "cropType": "Tomato",
    "soilMoisture": 45.2,
    "soilTemperature": 24.5,
    "airTemperature": 29.1,
    "airHumidity": 65.0,
    "sunlightLux": 52000
  }'`;

  const copyToClipboard = (text: string, type: 'key' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
    onShowToast({
      title: 'Copied',
      message: 'Copied to clipboard.',
      type: 'info'
    });
  };

  const handleTestSpeech = () => {
    const testText = language === 'te'
      ? 'నమస్కారం! ఫామ్‌సేజ్ వాయిస్ అసిస్టెంట్ తెలుగు మరియు ఇంగ్లీష్ భాషలలో రైతులకు సహాయం చేయడానికి సిద్ధంగా ఉంది.'
      : 'Hello farmer! FarmSage AI voice speech synthesis is operating properly in your browser.';

    SpeechService.speak(testText, language);
    onShowToast({
      title: language === 'te' ? 'వాయిస్ పరీక్ష' : 'Voice Test',
      message: language === 'te' ? 'వాయిస్ అవుట్‌పుట్ ప్లే అవుతోంది.' : 'Testing audio synthesizer playback.',
      type: 'info'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3E2A] font-serif tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#2C6A41]" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="text-sm text-[#4E6154] mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Language Preferences */}
      <div className="bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1B3E2A] flex items-center gap-2">
          <Languages className="w-5 h-5 text-[#2C6941]" />
          <span>{t.settings.languageSetting}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onToggleLanguage('en')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              language === 'en'
                ? 'border-[#214E34] bg-[#E8F2EA] text-[#183B28] font-bold shadow-xs'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="text-sm font-extrabold">English (United States / India)</div>
            <p className="text-xs text-gray-500 mt-1">Default interface and voice output</p>
          </button>

          <button
            type="button"
            onClick={() => onToggleLanguage('te')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              language === 'te'
                ? 'border-[#214E34] bg-[#E8F2EA] text-[#183B28] font-bold shadow-xs'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="text-sm font-extrabold">తెలుగు (Telugu - భారతదేశం)</div>
            <p className="text-xs text-gray-500 mt-1">పూర్తి తెలుగు అనువాదం మరియు వాయిస్</p>
          </button>
        </div>
      </div>

      {/* IoT Sensor Gateway & API Integration */}
      <div className="bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1B3E2A] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#2C6941]" />
            <span>{t.settings.iotApiKeyTitle}</span>
          </h3>

          <button
            type="button"
            onClick={onSimulateSensor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F6F2] hover:bg-[#E2EDE5] text-[#1F492E] text-xs font-semibold border border-[#BED4C4]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#2C6941]" />
            <span>{t.settings.simulateSensorCta}</span>
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          {t.settings.iotApiKeyDesc}
        </p>

        {/* API Key Box */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <KeyRound className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={gatewayKey}
            onChange={(e) => setGatewayKey(e.target.value)}
            placeholder={t.settings.iotKeyPlaceholder}
            className="text-xs font-mono text-gray-800 flex-1 bg-transparent border-none focus:outline-none"
          />
          <button
            type="button"
            onClick={() => copyToClipboard(displayKey, 'key')}
            className="text-xs font-semibold text-[#214E34] hover:text-[#183B27] flex items-center gap-1"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
          </button>
        </div>

        {/* Developer cURL Example */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-gray-400" />
              <span>Real-Time Sensor Hardware Payload Example</span>
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(curlExample, 'curl')}
              className="text-xs font-semibold text-[#214E34] hover:underline flex items-center gap-1"
            >
              {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>Copy cURL</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-gray-900 text-lime-400 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
            {curlExample}
          </pre>
        </div>
      </div>

      {/* Text-to-Speech & Voice Settings */}
      <div className="bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1B3E2A] flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#2C6941]" />
          <span>{t.settings.audioVoiceTitle}</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          {t.settings.audioVoiceDesc}
        </p>

        <button
          type="button"
          onClick={handleTestSpeech}
          className="px-4 py-2.5 rounded-xl bg-[#214E34] hover:bg-[#183B27] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Volume2 className="w-4 h-4 text-[#A3E635]" />
          <span>{t.settings.testSpeech}</span>
        </button>
      </div>
    </div>
  );
};
