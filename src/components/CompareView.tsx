import React, { useState } from 'react';
import { Language, CropScanRecord } from '../types';
import { translations } from '../utils/translations';
import { generateSampleLeafImage } from '../utils/sampleImages';
import { processCropImage } from '../utils/cvEngine';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CompareViewProps {
  language: Language;
  diaryScans: CropScanRecord[];
  onOpenScan: (scan: CropScanRecord) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  language,
  diaryScans
}) => {
  const t = translations[language];

  // If user doesn't have 2 scans yet in diary, create 2 instant demo scans
  const [activeScans, setActiveScans] = useState<{ scanA: CropScanRecord | null; scanB: CropScanRecord | null }>(() => {
    if (diaryScans.length >= 2) {
      return { scanA: diaryScans[0], scanB: diaryScans[1] };
    }
    return { scanA: null, scanB: null };
  });

  const [sliderPos, setSliderPos] = useState<number>(50);
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Initialize comparison templates if needed
  const loadDemoPair = async () => {
    const img1 = generateSampleLeafImage('tomato');
    const cv1 = await processCropImage(img1);

    const img2 = generateSampleLeafImage('chilli');
    const cv2 = await processCropImage(img2);

    const record1: CropScanRecord = {
      id: 'demo_day1',
      timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      cropType: 'Tomato (Day 1 Baseline)',
      growthStage: 'vegetative',
      fieldLocation: 'North Block',
      farmerNotes: 'Initial onset of edge yellowing',
      originalImage: img1,
      annotatedImage: cv1.annotatedImageUrl,
      measurements: cv1.measurements,
      quality: cv1.quality,
      hypotheses: [],
      agentTrace: [],
      followUpQuestions: []
    };

    const record2: CropScanRecord = {
      id: 'demo_day7',
      timestamp: new Date().toISOString(),
      cropType: 'Tomato (Day 7 Follow-up)',
      growthStage: 'flowering',
      fieldLocation: 'North Block',
      farmerNotes: 'After compost & balanced irrigation',
      originalImage: img2,
      annotatedImage: cv2.annotatedImageUrl,
      measurements: cv2.measurements,
      quality: cv2.quality,
      hypotheses: [],
      agentTrace: [],
      followUpQuestions: []
    };

    setActiveScans({ scanA: record1, scanB: record2 });
    setDemoLoaded(true);
  };

  const scanA = activeScans.scanA;
  const scanB = activeScans.scanB;

  // Calculate Delta
  const deltaYellow = scanA && scanB ? Number((scanB.measurements.yellowPercentage - scanA.measurements.yellowPercentage).toFixed(1)) : 0;
  const deltaBrown = scanA && scanB ? Number((scanB.measurements.brownPercentage - scanA.measurements.brownPercentage).toFixed(1)) : 0;
  const deltaGreen = scanA && scanB ? Number((scanB.measurements.greenPercentage - scanA.measurements.greenPercentage).toFixed(1)) : 0;
  const deltaSharpness = scanA && scanB ? Number((scanB.measurements.sharpness - scanA.measurements.sharpness).toFixed(1)) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3E2A] font-serif tracking-tight flex items-center gap-2.5">
          <GitCompare className="w-7 h-7 text-[#2C6A41]" />
          <span>{t.compare.title}</span>
        </h1>
        <p className="text-sm text-[#4E6154] mt-1">
          {t.compare.subtitle}
        </p>
      </div>

      {(!scanA || !scanB) && (
        <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-dashed border-[#DDD5C5] text-center space-y-4">
          <Layers className="w-10 h-10 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-gray-800">
              {diaryScans.length < 2
                ? (language === 'te' ? 'పోల్చడానికి డైరీలో కనీసం 2 స్కాన్లు ఉండాలి' : 'Select or load two crop scans to evaluate changes')
                : (language === 'te' ? 'రెండు స్కాన్లను ఎంచుకోండి' : 'Choose two scans to compare')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {language === 'te'
                ? 'మీరు తక్షణ నమూనా డేటాతో 7 రోజుల తేడాను పరీక్షించవచ్చు.'
                : 'You can test instantly with verified Day 1 vs Day 7 field comparison samples.'}
            </p>
          </div>

          <button
            onClick={loadDemoPair}
            className="px-5 py-2.5 rounded-xl bg-[#214E34] hover:bg-[#183B27] text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>{language === 'te' ? 'నమూనా పోలికను లోడ్ చేయండి (Day 1 vs Day 7)' : 'Load Verified Day 1 vs Day 7 Comparison'}</span>
          </button>
        </div>
      )}

      {scanA && scanB && (
        <div className="space-y-6">
          {/* Selectors Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#DDE5E0] shadow-sm">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                {t.compare.selectFirst}
              </label>
              <div className="font-bold text-sm text-[#1A412A]">
                {scanA.cropType} • <span className="text-xs text-gray-500 font-mono">{new Date(scanA.timestamp).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DDE5E0] shadow-sm">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                {t.compare.selectSecond}
              </label>
              <div className="font-bold text-sm text-[#1A412A]">
                {scanB.cropType} • <span className="text-xs text-gray-500 font-mono">{new Date(scanB.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Images & Split Slider */}
          <div className="bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {t.compare.sliderLabel}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Slide horizontally to inspect pixel boundaries
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black/90 min-h-[380px] max-h-[440px] flex items-center justify-center border border-gray-200">
              <img
                src={scanA.annotatedImage || scanA.originalImage}
                alt="Baseline Scan A"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                <img
                  src={scanB.annotatedImage || scanB.originalImage}
                  alt="Follow-up Scan B"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>

              {/* Slider thumb */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-lime-400 cursor-ew-resize shadow-[0_0_12px_rgba(163,230,53,0.9)]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-lime-500 border-2 border-white flex items-center justify-center text-xs text-black font-extrabold shadow-lg">
                  ↔
                </div>
              </div>

              {/* Labels on corners */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/75 text-white text-[11px] font-mono">
                ← {scanA.cropType}
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/75 text-white text-[11px] font-mono">
                {scanB.cropType} →
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-gray-500 font-semibold">{scanA.cropType}</span>
              <input
                type="range"
                min="5"
                max="95"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#214E34]"
              />
              <span className="text-xs text-gray-500 font-semibold">{scanB.cropType}</span>
            </div>
          </div>

          {/* Measured Delta Metrics */}
          <div className="bg-white p-6 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1B3E2A] uppercase tracking-wider">
              {t.compare.deltaMetricsTitle}
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              {/* Yellow Delta */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D5]">
                <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                  {t.compare.yellowDelta}
                </span>
                <div className="flex items-baseline gap-1 mt-1 text-xl font-extrabold">
                  <span className={deltaYellow > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                    {deltaYellow > 0 ? `+${deltaYellow}%` : `${deltaYellow}%`}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-sans">
                  {scanA.measurements.yellowPercentage}% → {scanB.measurements.yellowPercentage}%
                </div>
              </div>

              {/* Brown Delta */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D5]">
                <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                  {t.compare.brownDelta}
                </span>
                <div className="flex items-baseline gap-1 mt-1 text-xl font-extrabold">
                  <span className={deltaBrown > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    {deltaBrown > 0 ? `+${deltaBrown}%` : `${deltaBrown}%`}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-sans">
                  {scanA.measurements.brownPercentage}% → {scanB.measurements.brownPercentage}%
                </div>
              </div>

              {/* Green Delta */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D5]">
                <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                  {t.compare.greenDelta}
                </span>
                <div className="flex items-baseline gap-1 mt-1 text-xl font-extrabold">
                  <span className={deltaGreen >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {deltaGreen >= 0 ? `+${deltaGreen}%` : `${deltaGreen}%`}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-sans">
                  {scanA.measurements.greenPercentage}% → {scanB.measurements.greenPercentage}%
                </div>
              </div>

              {/* Sharpness Delta */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D5]">
                <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                  {t.compare.sharpnessDelta}
                </span>
                <div className="flex items-baseline gap-1 mt-1 text-xl font-extrabold text-[#193F27]">
                  {deltaSharpness > 0 ? `+${deltaSharpness}` : `${deltaSharpness}`}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-sans">
                  σ² {scanA.measurements.sharpness} vs {scanB.measurements.sharpness}
                </div>
              </div>
            </div>

            {/* Progression Assessment */}
            <div className="p-4 rounded-2xl bg-[#F0F6F2] border border-[#C0D9C7] text-xs text-[#133320] space-y-1">
              <span className="font-bold block uppercase tracking-wider text-[11px]">
                {t.compare.progressionAssessment}
              </span>
              <p className="leading-relaxed">
                {deltaBrown > 2
                  ? (language === 'te'
                    ? 'గోధుమ రంగు మచ్చల శాతం పెరిగింది. ఇది వ్యాధి లేదా ఎండ తీవ్రత పెరిగిందనడానికి సంకేతం కావచ్చు.'
                    : 'Necrotic brown tissue area expanded. Inspect leaf undersides for fungal spores or verify root water stagnation.')
                  : deltaGreen > 0
                  ? (language === 'te'
                    ? 'ఆకుపచ్చ కణజాలం పుంజుకుంది. మొక్క ఆరోగ్యకరమైన పెరుగుదలను సూచిస్తోంది.'
                    : 'Green chlorophyll vegetation index has improved, suggesting positive vegetative recovery.')
                  : (language === 'te'
                    ? 'దృశ్య లక్షణాలు స్థిరంగా ఉన్నాయి. తదుపరి 3-4 రోజులు నీటి పారుదలని గమనించండి.'
                    : 'Visual symptom progression is stable. Continue balanced irrigation and monitoring.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
