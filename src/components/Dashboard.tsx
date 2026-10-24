import React from 'react';
import { Language, SensorReading, CropScanRecord } from '../types';
import { translations } from '../utils/translations';
import {
  ScanLine,
  Droplets,
  Thermometer,
  Sun,
  Wind,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

interface DashboardProps {
  language: Language;
  onNavigate: (tab: string) => void;
  sensorData: SensorReading | null;
  recentScans: CropScanRecord[];
  onSimulateSensor: () => void;
  onOpenVoiceAgronomist?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  language,
  onNavigate,
  sensorData,
  recentScans,
  onSimulateSensor,
  onOpenVoiceAgronomist
}) => {
  const t = translations[language];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#173D26] via-[#1E4D30] to-[#2B6843] text-white p-6 sm:p-8 shadow-md border border-[#347A50]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3E635]/20 border border-[#A3E635]/40 text-[#A3E635] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OpenCV Computer Vision + Evidence-Based Agent</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight text-[#FBF9F5]">
            {t.dashboard.welcome}
          </h1>
          <p className="text-sm sm:text-base text-[#D4E8DC] leading-relaxed">
            {t.dashboard.subheading}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('scan')}
              className="px-5 py-3 rounded-xl bg-[#A3E635] hover:bg-[#8CD31E] text-[#122A1C] text-sm font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t.dashboard.quickScanCta}</span>
            </button>

            <button
              onClick={() => {
                if (onOpenVoiceAgronomist) {
                  onOpenVoiceAgronomist();
                } else {
                  onNavigate('ask');
                }
              }}
              className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold border border-white/30 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>🎙️</span>
              <span>{language === 'te' ? 'Ask Voice Agronomist (వాయిస్ అగ్రోనమిస్ట్)' : 'Ask Voice Agronomist'}</span>
            </button>
          </div>
        </div>

        {/* Decorative foliage watermark background */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none">
          <Layers className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Live Field Telemetry (IoT Gateway) */}
      <div className="bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1B3E2A]">
                  {t.dashboard.liveTelemetryTitle}
                </h2>
                {sensorData?.isSimulated && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                    {language === 'te' ? 'డెమో / సిమ్యులేటెడ్ డేటా' : 'Demo / Simulated Data'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono">
                Field ID: {sensorData?.fieldId || 'Block-North-4'} • {sensorData?.isSimulated ? (language === 'te' ? 'సిమ్యులేటెడ్ డెమో డేటా (Demo Stream)' : 'Simulated Demo Stream') : 'Live IoT Stream'}
              </p>
            </div>
          </div>

          <button
            onClick={onSimulateSensor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F6F2] hover:bg-[#E2EDE5] text-[#1F492E] text-xs font-semibold border border-[#BED4C4] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#2C6941]" />
            <span>{t.settings.simulateSensorCta}</span>
          </button>
        </div>

        {sensorData ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Soil Moisture */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[11px] font-bold">{t.dashboard.soilMoisture}</span>
                <Droplets className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-extrabold text-[#173F28] font-mono">
                {sensorData.soilMoisture}%
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {sensorData.soilMoisture >= 30 && sensorData.soilMoisture <= 65 ? 'Optimal Root Zone' : 'Check Drainage'}
              </div>
            </div>

            {/* Soil Temperature */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[11px] font-bold">{t.dashboard.soilTemp}</span>
                <Thermometer className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-[#173F28] font-mono">
                {sensorData.soilTemperature}°C
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Aeration stable</div>
            </div>

            {/* Air Temp */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[11px] font-bold">{t.dashboard.airTemp}</span>
                <Thermometer className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-extrabold text-[#173F28] font-mono">
                {sensorData.airTemperature}°C
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Canopy ambient</div>
            </div>

            {/* Air Humidity */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[11px] font-bold">{t.dashboard.airHumidity}</span>
                <Wind className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-extrabold text-[#173F28] font-mono">
                {sensorData.airHumidity}%
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Relative humidity</div>
            </div>

            {/* Sunlight Lux */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[11px] font-bold">{t.dashboard.sunlight}</span>
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-extrabold text-[#173F28] font-mono">
                {Math.round(sensorData.sunlightLux / 1000)}k
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">PAR incident</div>
            </div>

            {/* N-P-K */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2EBE5]">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[11px] font-bold">N-P-K (ppm)</span>
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm font-extrabold text-[#173F28] font-mono mt-1">
                {sensorData.nitrogenPpm}:{sensorData.phosphorusPpm}:{sensorData.potassiumPpm}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Soil test baseline</div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400 text-xs">
            Connecting to IoT sensor gateway...
          </div>
        )}
      </div>

      {/* Two Column Layout: Recent Scans + Evidence Diagnostic Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Scans */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B3E2A]">
              {t.dashboard.recentScansTitle}
            </h3>
            <button
              onClick={() => onNavigate('diary')}
              className="text-xs font-bold text-[#275F3C] hover:underline flex items-center gap-1"
            >
              <span>{language === 'te' ? 'అన్నీ చూడండి' : 'View Diary'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-3">
              {recentScans.slice(0, 3).map(scan => (
                <div
                  key={scan.id}
                  onClick={() => onNavigate('scan')}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 hover:border-[#BED4C4] hover:bg-[#F9FCFA] transition-colors cursor-pointer group"
                >
                  <img
                    src={scan.annotatedImage || scan.originalImage}
                    alt={scan.cropType}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#183925] truncate">
                        {scan.cropType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F2EA] text-[#225032] uppercase">
                        {scan.growthStage}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Sharpness: {scan.measurements.sharpness} | Yellow: {scan.measurements.yellowPercentage}% | Brown: {scan.measurements.brownPercentage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 font-mono block">
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-bold text-[#2A6540] group-hover:underline">
                      Inspect
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-[#FAF9F5] border border-dashed border-[#DDD5C5] space-y-2">
              <FileText className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-500">{t.dashboard.noRecentScans}</p>
              <button
                onClick={() => onNavigate('scan')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#214E34] text-white text-xs font-bold hover:bg-[#183B27]"
              >
                {t.dashboard.quickScanCta}
              </button>
            </div>
          )}
        </div>

        {/* Evidence-Based Diagnostic Protocol */}
        <div className="lg:col-span-5 bg-[#FAF9F5] p-6 rounded-3xl border border-[#DDD5C5] shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#2F261B] font-serif flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>{t.dashboard.diagnosticGuideTitle}</span>
          </h3>

          <div className="space-y-3 text-xs text-gray-700">
            <div className="p-3 rounded-xl bg-white border border-[#E5DECة] space-y-1">
              <span className="font-bold text-[#183925] block">1. Real OpenCV Mathematical Analysis</span>
              <p className="text-gray-600 leading-relaxed">{t.dashboard.guideTip1}</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5DECة] space-y-1">
              <span className="font-bold text-[#183925] block">2. Visual Symptom Indication vs Diagnosis</span>
              <p className="text-gray-600 leading-relaxed">{t.dashboard.guideTip2}</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5DECة] space-y-1">
              <span className="font-bold text-[#183925] block">3. Adaptive Agent Verification Trace</span>
              <p className="text-gray-600 leading-relaxed">{t.dashboard.guideTip3}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Mandatory Agricultural Safety Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex items-start gap-3.5 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold tracking-wide uppercase text-amber-900">
            {t.common.safetyDisclaimerTitle}
          </h4>
          <p className="text-xs text-amber-900/90 leading-relaxed font-sans">
            {t.common.safetyDisclaimerText}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 pt-0.5">
            {t.common.expertAdviceNote}
          </p>
        </div>
      </div>
    </div>
  );
};
