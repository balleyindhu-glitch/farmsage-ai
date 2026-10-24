import React, { useState, useRef } from 'react';
import {
  Language,
  GrowthStage,
  CropScanRecord,
  ToastMessage,
  SensorReading
} from '../types';
import { translations } from '../utils/translations';
import { processCropImage } from '../utils/cvEngine';
import { runAgentDecisionProcess, recalculateWithFarmerEvidence } from '../utils/agentProcess';
import { generateManagementAdvice } from '../utils/managementAdvisor';
import { generateFarmSagePDFReport } from '../utils/pdfGenerator';
import { generateSampleLeafImage } from '../utils/sampleImages';
import { VoiceAgronomistModal } from './VoiceAgronomistModal';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  BookmarkCheck,
  RefreshCw,
  Eye,
  Sliders,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sprout,
  Droplets,
  CalendarCheck,
  Info
} from 'lucide-react';

interface CropScannerProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  onSaveToDiary: (record: CropScanRecord) => void;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
  sensorData: SensorReading | null;
}

export const CropScanner: React.FC<CropScannerProps> = ({
  language,
  onToggleLanguage,
  onSaveToDiary,
  onShowToast,
  sensorData
}) => {
  const t = translations[language];

  // Voice Agronomist Modal State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>('Tomato');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');
  const [farmerNotes, setFarmerNotes] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [scanResult, setScanResult] = useState<CropScanRecord | null>(null);

  // Results View Toggle
  const [viewMode, setViewMode] = useState<'annotated' | 'original' | 'split'>('annotated');
  const [splitPos, setSplitPos] = useState<number>(50);

  // Agent Follow-up Answers
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSavedToDiary, setIsSavedToDiary] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and handle file input
  const handleFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onShowToast({
        title: language === 'te' ? 'చెల్లని ఫైల్ రకం' : 'Invalid File Type',
        message: language === 'te' ? 'దయచేసి JPEG, PNG లేదా WebP ఫోటో మాత్రమే అప్‌లోడ్ చేయండి.' : 'Please upload a valid JPEG, PNG, or WebP crop photo.',
        type: 'error'
      });
      return;
    }

    // 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      onShowToast({
        title: language === 'te' ? 'ఫైల్ పరిమాణం చాలా పెద్దది' : 'File Too Large',
        message: language === 'te' ? 'ఫోటో పరిమాణం 15MB కంటే తక్కువగా ఉండాలి.' : 'Image file size must be under 15MB.',
        type: 'error'
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setScanResult(null);
      setIsSavedToDiary(false);
      setUserAnswers({});
      onShowToast({
        title: language === 'te' ? 'చిత్రం స్వీకరించబడింది' : 'Photo Ready',
        message: language === 'te' ? 'ఫోటో విజయవంతంగా అప్‌లోడ్ చేయబడింది. విశ్లేషణ ప్రారంభించవచ్చు.' : 'Photo uploaded. Ready to run OpenCV computer-vision analysis.',
        type: 'info'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Load verified test sample
  const handleLoadSample = (sampleType: 'tomato' | 'paddy' | 'chilli' | 'healthy' | 'blurry') => {
    const dataUrl = generateSampleLeafImage(sampleType);
    setImagePreview(dataUrl);
    setSelectedFile(null);
    setScanResult(null);
    setIsSavedToDiary(false);
    setUserAnswers({});

    if (sampleType === 'tomato') {
      setCropType('Tomato');
      setGrowthStage('flowering');
      setFarmerNotes('Chlorotic yellowing at margins with localized necrotic spots after unseasonal rain.');
    } else if (sampleType === 'paddy') {
      setCropType('Paddy / Rice');
      setGrowthStage('vegetative');
      setFarmerNotes('Spindle-shaped gray-centered lesions on upper leaf blades with high field humidity.');
    } else if (sampleType === 'chilli') {
      setCropType('Chilli');
      setGrowthStage('vegetative');
      setFarmerNotes('Interveinal yellowing with veins staying green on new apical shoots.');
    } else if (sampleType === 'healthy') {
      setCropType('Cotton');
      setGrowthStage('vegetative');
      setFarmerNotes('Vigorous, dark-green healthy foliage with no visible spotting or chlorosis.');
    } else if (sampleType === 'blurry') {
      setCropType('Tomato');
      setGrowthStage('flowering');
      setFarmerNotes('Out-of-focus handheld capture taken while moving in field.');
    }

    onShowToast({
      title: language === 'te' ? 'నమూనా ఆకు లోడ్ అయింది' : 'Field Sample Loaded',
      message: language === 'te' ? `పరీక్ష కోసం ${sampleType} నమూనా ఆకు చిత్రం సిద్ధంగా ఉంది.` : `Loaded verified ${sampleType} sample for real-time testing.`,
      type: 'info'
    });
  };

  // Execute full CV and Agent evaluation pipeline
  const runAnalysis = async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    onShowToast({
      title: language === 'te' ? 'విశ్లేషణ ప్రారంభమైంది' : 'Analysis Started',
      message: language === 'te' ? 'కంప్యూటర్ విజన్ పిక్సెల్ గణన మొదలైంది...' : 'Executing OpenCV-grade pixel extraction & Laplacian kernel...',
      type: 'info'
    });

    try {
      setProcessingStage(t.scan.stepPixelExtraction);
      await new Promise(r => setTimeout(r, 250));

      setProcessingStage(t.scan.stepLaplacianEdge);
      await new Promise(r => setTimeout(r, 300));

      setProcessingStage(t.scan.stepColorSegmentation);
      const cvOutput = await processCropImage(imagePreview);

      setProcessingStage(t.scan.stepAgentEvaluation);
      await new Promise(r => setTimeout(r, 300));

      const agentOutput = runAgentDecisionProcess(
        cvOutput.measurements,
        cvOutput.quality,
        cropType,
        growthStage,
        farmerNotes,
        sensorData
      );

      const managementAdvice = generateManagementAdvice(
        cropType,
        growthStage,
        cvOutput.measurements,
        cvOutput.quality,
        agentOutput.hypotheses,
        farmerNotes,
        {},
        sensorData
      );

      const record: CropScanRecord = {
        id: `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        cropType: cropType || 'Crop',
        growthStage,
        fieldLocation: sensorData?.fieldId || 'Main Plot',
        farmerNotes,
        originalImage: imagePreview,
        annotatedImage: cvOutput.annotatedImageUrl,
        measurements: cvOutput.measurements,
        quality: cvOutput.quality,
        hypotheses: agentOutput.hypotheses,
        agentTrace: agentOutput.agentTrace,
        followUpQuestions: agentOutput.followUpQuestions,
        managementAdvice
      };

      setScanResult(record);
      setIsProcessing(false);

      if (cvOutput.quality.warnings.length > 0) {
        onShowToast({
          title: language === 'te' ? 'చిత్ర నాణ్యత హెచ్చరిక' : 'Image Quality Alert',
          message: cvOutput.quality.warnings[0][language],
          type: 'warning'
        });
      } else {
        onShowToast({
          title: language === 'te' ? 'విశ్లేషణ పూర్తయింది' : 'Analysis Complete',
          message: language === 'te' ? 'దృశ్య ఆధారాలు మరియు సాధ్యమైన వివరణలు సిద్ధమయ్యాయి.' : 'Computer-vision measurements and competing hypotheses ready.',
          type: 'success'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      onShowToast({
        title: language === 'te' ? 'విశ్లేషణలో లోపం' : 'Processing Error',
        message: err?.message || 'Failed to process crop image.',
        type: 'error'
      });
    }
  };

  // Recalculate with farmer's answers
  const handleRecalculate = () => {
    if (!scanResult) return;
    const { revisedHypotheses, updatedTrace } = recalculateWithFarmerEvidence(
      scanResult.hypotheses,
      scanResult.followUpQuestions,
      userAnswers,
      scanResult.agentTrace
    );

    const updatedAdvice = generateManagementAdvice(
      scanResult.cropType,
      scanResult.growthStage,
      scanResult.measurements,
      scanResult.quality,
      revisedHypotheses,
      scanResult.farmerNotes,
      userAnswers,
      sensorData
    );

    const updatedRecord: CropScanRecord = {
      ...scanResult,
      hypotheses: revisedHypotheses,
      agentTrace: updatedTrace,
      managementAdvice: updatedAdvice
    };

    setScanResult(updatedRecord);
    onShowToast({
      title: language === 'te' ? 'ఆధారాలు సవరించబడ్డాయి' : 'Evidence Integrated',
      message: language === 'te' ? 'మీ క్షేత్ర సమాచారంతో వివరణల సంభావ్యత నవీకరించబడింది.' : 'Recalibrated differential hypothesis probabilities with your field observations.',
      type: 'success'
    });
  };

  // Save to diary
  const handleSaveDiary = () => {
    if (!scanResult) return;
    onSaveToDiary(scanResult);
    setIsSavedToDiary(true);
    onShowToast({
      title: language === 'te' ? 'డైరీలో భద్రపరచబడింది' : 'Saved to Diary',
      message: language === 'te' ? 'పంట స్కాన్ రికార్డు విజయవంతంగా భద్రపరచబడింది.' : 'Crop scan record added to your historical diary.',
      type: 'success'
    });
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    if (!scanResult) return;
    try {
      await generateFarmSagePDFReport(scanResult);
      onShowToast({
        title: language === 'te' ? 'నివేదిక రూపొందించబడింది' : 'Report Generated',
        message: language === 'te' ? 'FarmSage PDF నివేదిక డౌన్‌లోడ్ అవుతోంది.' : 'FarmSage diagnostic report downloaded successfully.',
        type: 'success'
      });
    } catch (err: any) {
      onShowToast({
        title: language === 'te' ? 'PDF లోపం' : 'PDF Export Error',
        message: err?.message || 'Could not generate report.',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3E2A] font-serif tracking-tight">
          {t.scan.title}
        </h1>
        <p className="text-sm text-[#4E6154] mt-1 font-sans">
          {t.scan.subtitle}
        </p>
      </div>

      {/* Upload & Form Section */}
      {!scanResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Drag & Drop Area */}
          <div className="lg:col-span-7 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[320px] ${
                dragActive
                  ? 'border-[#2D6A42] bg-[#E8F2EA]'
                  : 'border-[#CAD8CE] bg-white hover:border-[#387B4E] hover:bg-[#F7FAF8]'
              } shadow-sm`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
              />

              {imagePreview ? (
                <div className="relative group w-full flex flex-col items-center">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="max-h-64 rounded-xl object-contain shadow-md border border-[#D5E2D9]"
                  />
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#275A38] bg-[#E8F2EA] px-3 py-1.5 rounded-full border border-[#BED4C4]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{selectedFile ? selectedFile.name : 'Sample Field Image Active'}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600 underline">Change Photo</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[#E8F2EA] flex items-center justify-center text-[#275A38] mb-4 border border-[#BED4C4] shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#1F412D]">{t.scan.dropzoneHeading}</h3>
                  <p className="text-xs text-[#5C6E62] max-w-sm mt-1">{t.scan.dropzoneSubheading}</p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 rounded-xl bg-[#214E34] text-white text-xs font-bold hover:bg-[#183B27] transition-colors shadow-sm"
                  >
                    {t.scan.browseButton}
                  </button>
                </>
              )}
            </div>

            {/* Verified Sample Images for Instant Demonstration */}
            <div className="bg-[#F4F1EA] p-4 rounded-2xl border border-[#DDD5C5]">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#42382D] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>{t.scan.samplePhotosHeading}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('tomato')}
                  className="text-left p-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#D7CFC0] transition-colors group"
                >
                  <div className="text-xs font-bold text-[#1E3B29] group-hover:text-[#2D6A42]">
                    🍅 {t.scan.samplePhotoTomato.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Early Blight & spots</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadSample('paddy')}
                  className="text-left p-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#D7CFC0] transition-colors group"
                >
                  <div className="text-xs font-bold text-[#1E3B29] group-hover:text-[#2D6A42]">
                    🌾 {t.scan.samplePhotoPaddy.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Rice Blast spindle spots</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadSample('chilli')}
                  className="text-left p-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#D7CFC0] transition-colors group"
                >
                  <div className="text-xs font-bold text-[#1E3B29] group-hover:text-[#2D6A42]">
                    🌶️ {t.scan.samplePhotoChilli.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Interveinal chlorosis</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadSample('healthy')}
                  className="text-left p-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-emerald-300 transition-colors group"
                >
                  <div className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700">
                    🌿 {t.scan.samplePhotoHealthy.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Healthy chlorophyll</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadSample('blurry')}
                  className="text-left p-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 transition-colors group"
                >
                  <div className="text-xs font-bold text-rose-900 group-hover:text-rose-700">
                    🔍 {t.scan.samplePhotoBlurry.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">Uncertainty / blur test</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Agronomy Context Metadata Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#DDE5E0] shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#1B3E2A] uppercase tracking-wider flex items-center gap-2">
                <FileImage className="w-4 h-4 text-[#2E6B43]" />
                <span>Field Context & Crop Information</span>
              </h3>

              {/* Crop Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.scan.cropTypeLabel}
                </label>
                <input
                  type="text"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  placeholder={t.scan.cropTypePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6941] bg-[#FCFBF8]"
                />
              </div>

              {/* Growth Stage */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.scan.stageLabel}
                </label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6941] bg-[#FCFBF8]"
                >
                  <option value="seedling">Seedling / Nursery (మొలక దశ)</option>
                  <option value="vegetative">Vegetative Growth (శాకీయ పెరుగుదల దశ)</option>
                  <option value="flowering">Flowering / Budding (పూత దశ)</option>
                  <option value="fruiting">Fruiting / Grain Fill (కాయ / గింజ దశ)</option>
                  <option value="maturation">Maturation (పక్వత దశ)</option>
                  <option value="harvest">Harvest Stage (కోత దశ)</option>
                </select>
              </div>

              {/* Farmer Observation Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.scan.notesLabel}
                </label>
                <textarea
                  rows={3}
                  value={farmerNotes}
                  onChange={(e) => setFarmerNotes(e.target.value)}
                  placeholder={t.scan.notesPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6941] bg-[#FCFBF8]"
                />
              </div>

              {/* Telemetry info badge if sensor data exists */}
              {sensorData && (
                <div className="p-3 rounded-xl bg-[#E8F2EA] border border-[#BED4C4] text-xs space-y-1">
                  <div className="font-bold text-[#1A452B] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-lime-600" />
                      <span>{sensorData.isSimulated ? 'Field Telemetry (Simulated Demo):' : 'Real-time Field Context Attached:'}</span>
                    </div>
                    {sensorData.isSimulated && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase">Demo Data</span>
                    )}
                  </div>
                  <div className="text-gray-700 font-mono text-[11px]">
                    Soil Moisture: <span className="font-bold">{sensorData.soilMoisture}%</span> | Temp: <span className="font-bold">{sensorData.airTemperature}°C</span> | Humidity: <span className="font-bold">{sensorData.airHumidity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Run Button / Processing State */}
            <div>
              {isProcessing ? (
                <div className="p-4 rounded-xl bg-[#F0F6F2] border border-[#BED4C4] text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#214E34]">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#2D6A42]" />
                    <span>{t.scan.processingTitle}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono animate-pulse">
                    {processingStage}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!imagePreview}
                  onClick={runAnalysis}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    imagePreview
                      ? 'bg-[#214E34] text-white hover:bg-[#183B27] cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#A3E635]" />
                  <span>{t.scan.runScanButton}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY SECTION */}
      {scanResult && (
        <div className="space-y-8 animate-fade-in">
          {/* Action Bar: Download PDF, Save to Diary, Rescan */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#DDE5E0] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {t.scan.resultsTitle}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                [{scanResult.cropType} • {scanResult.growthStage}]
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#214E34] hover:bg-[#183B27] text-white text-xs font-bold border border-[#3E8058] transition-colors shadow-sm cursor-pointer"
              >
                <span>🎙️</span>
                <span>{language === 'te' ? 'Ask Voice Agronomist (వాయిస్ అగ్రోనమిస్ట్)' : 'Ask Voice Agronomist'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#214E34] text-white text-xs font-bold hover:bg-[#183B27] transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>{t.common.downloadReport}</span>
              </button>

              <button
                type="button"
                disabled={isSavedToDiary}
                onClick={handleSaveDiary}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isSavedToDiary
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BookmarkCheck className={`w-3.5 h-3.5 ${isSavedToDiary ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span>{isSavedToDiary ? t.common.saved : t.common.saveToDiary}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScanResult(null);
                  setImagePreview(null);
                  setSelectedFile(null);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.scan.reScanButton}</span>
              </button>
            </div>
          </div>

          {/* Quality Assessment Alert Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            scanResult.quality.isBlurry || scanResult.quality.isPoorFraming
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : scanResult.quality.warnings.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-[#F0F6F2] border-[#C2DBC9] text-[#12311F]'
          }`}>
            <div className="flex items-start gap-3">
              {scanResult.quality.warnings.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{t.scan.qualityBadgeTitle}</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/80 border border-current">
                    Score: {scanResult.quality.qualityScore}/100
                  </span>
                </div>
                <p className="text-xs mt-1 text-gray-700 font-medium">
                  {scanResult.quality.recommendation[language]}
                </p>
                {scanResult.quality.warnings.map(w => (
                  <p key={w.code} className="text-xs font-semibold mt-0.5 text-amber-800">
                    ⚠️ {w[language]}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid: Visual Imagery Viewer & Computer Vision Measured Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Image Viewer with Modes */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#DDE5E0] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#2C6941]" />
                  <span>Visual Evidence Inspection</span>
                </span>

                {/* View Mode Tabs */}
                <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setViewMode('annotated')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      viewMode === 'annotated'
                        ? 'bg-[#214E34] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.scan.annotatedViewTab}
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      viewMode === 'original'
                        ? 'bg-[#214E34] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.scan.originalViewTab}
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      viewMode === 'split'
                        ? 'bg-[#214E34] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.scan.splitViewTab}
                  </button>
                </div>
              </div>

              {/* Image Viewer Area */}
              <div className="relative rounded-xl overflow-hidden bg-black/90 flex items-center justify-center min-h-[360px] max-h-[460px] border border-gray-200">
                {viewMode === 'annotated' && (
                  <img
                    src={scanResult.annotatedImage}
                    alt="CV Annotated Leaf HUD"
                    className="max-h-[450px] w-full object-contain"
                  />
                )}

                {viewMode === 'original' && (
                  <img
                    src={scanResult.originalImage}
                    alt="Original Uploaded Leaf"
                    className="max-h-[450px] w-full object-contain"
                  />
                )}

                {viewMode === 'split' && (
                  <div className="relative w-full h-[380px] overflow-hidden select-none">
                    <img
                      src={scanResult.originalImage}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
                    >
                      <img
                        src={scanResult.annotatedImage}
                        alt="Annotated"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                    {/* Vertical Divider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-lime-400 cursor-ew-resize shadow-[0_0_10px_rgba(163,230,53,0.8)]"
                      style={{ left: `${splitPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-lime-500 border-2 border-white flex items-center justify-center text-[10px] text-black font-bold">
                        ↔
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {viewMode === 'split' && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-gray-500 font-semibold">Original</span>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#214E34]"
                  />
                  <span className="text-xs text-gray-500 font-semibold">CV Mask</span>
                </div>
              )}

              {/* Color classification legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D6]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                  <span className="text-gray-700">Healthy Chlorophyll</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                  <span className="text-gray-700">Chlorotic Yellowing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
                  <span className="text-gray-700">Necrotic Brown Lesion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-900 inline-block"></span>
                  <span className="text-gray-700">Dark Spot / Soot</span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Measured Computer-Vision Evidence Cards */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#DDE5E0] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1B3E2A] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2C6941]" />
                <span>{t.scan.cvEvidenceTitle}</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 font-mono">
                {/* Sharpness Metric */}
                <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E2EBE5]">
                  <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                    {t.scan.sharpnessMetric}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-[#193F27]">
                      {scanResult.measurements.sharpness}
                    </span>
                    <span className="text-[10px] text-gray-400">var</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-sans font-semibold">
                    {scanResult.measurements.sharpness > 70 ? '✓ Crisp focus' : '⚠️ Blurry alert'}
                  </span>
                </div>

                {/* Brightness */}
                <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E2EBE5]">
                  <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                    {t.scan.brightnessMetric}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-[#193F27]">
                      {scanResult.measurements.brightness}
                    </span>
                    <span className="text-[10px] text-gray-400">/ 255</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans">
                    Luminance Y
                  </span>
                </div>

                {/* Dynamic Contrast */}
                <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E2EBE5]">
                  <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                    {t.scan.contrastMetric}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-[#193F27]">
                      {scanResult.measurements.contrast}
                    </span>
                    <span className="text-[10px] text-gray-400">σ</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans">
                    Dynamic range
                  </span>
                </div>

                {/* Foliage Coverage */}
                <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E2EBE5]">
                  <span className="text-[11px] text-gray-500 block uppercase font-sans font-bold">
                    Foliage Ratio
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-[#193F27]">
                      {scanResult.measurements.foliagePercentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans">
                    Of frame area
                  </span>
                </div>
              </div>

              {/* Color breakdown progress bars */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-gray-700 block uppercase tracking-wider font-sans">
                  Pixel Color Distributions
                </span>

                {/* Green */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-800">{t.scan.greenRatioMetric}</span>
                    <span className="font-mono text-emerald-900 font-bold">{scanResult.measurements.greenPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, scanResult.measurements.greenPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Yellow */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-800">{t.scan.yellowRatioMetric}</span>
                    <span className="font-mono text-amber-900 font-bold">{scanResult.measurements.yellowPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, scanResult.measurements.yellowPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Brown */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-red-800">{t.scan.brownRatioMetric}</span>
                    <span className="font-mono text-red-900 font-bold">{scanResult.measurements.brownPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, scanResult.measurements.brownPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Dark */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-900">Dark Micro-spots / Necrosis</span>
                    <span className="font-mono text-purple-950 font-bold">{scanResult.measurements.darkPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-900 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, scanResult.measurements.darkPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Safety notice in measurements panel */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Evidence Boundary:</strong> Color regions are visual physical measurements. They do not prove pathogen identity without microbiological confirmation.
                </span>
              </div>
            </div>
          </div>

          {/* 1. LIKELY CONDITION / DISEASE CARD */}
          {scanResult.managementAdvice && (
            <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
              !scanResult.managementAdvice.isEvidenceSufficient
                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                : scanResult.managementAdvice.conditionCategory === 'healthy_crop'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-[#F9F7F2] border-[#2E6B43]/30 text-[#153421]'
            }`}>
              {!scanResult.managementAdvice.isEvidenceSufficient ? (
                /* INSUFFICIENT EVIDENCE / BLURRY UNCERTAINTY CARD */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600 text-white">
                        UNCERTAINTY & CLINICAL SAFETY GATE
                      </span>
                      <span className="text-xs font-bold text-rose-700 font-mono">
                        [Quality Score: {scanResult.quality.qualityScore}/100 • Sharpness: {scanResult.measurements.sharpness} σ²]
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-rose-800 border border-rose-300">
                      {language === 'te' ? scanResult.managementAdvice.confidenceWordingTe : scanResult.managementAdvice.confidenceWordingEn}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-rose-950 font-serif tracking-tight flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                      <span>{language === 'te' ? scanResult.managementAdvice.likelyConditionTe : scanResult.managementAdvice.likelyConditionEn}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-rose-800 font-medium mt-1">
                      Safety Protocol: Disease identification is strictly withheld when image sharpness falls below diagnostic threshold. No specific pathogen is claimed.
                    </p>
                  </div>

                  {/* Why evidence is insufficient */}
                  <div className="p-4 bg-white/90 rounded-2xl border border-rose-200 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900 block">
                      {language === 'te' ? 'చిత్ర నాణ్యత ఎందుకు సరిపోలేదు (కారణాలు):' : 'Why Image Quality Is Insufficient:'}
                    </span>
                    <ul className="space-y-1.5 text-xs text-rose-900 list-disc pl-4">
                      {(language === 'te' ? scanResult.managementAdvice.whyEvidenceTe : scanResult.managementAdvice.whyEvidenceEn).map((reason, ri) => (
                        <li key={ri}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* How to take a better photo */}
                  <div className="p-4 bg-rose-100/70 rounded-2xl border border-rose-300 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-950 block">
                      {language === 'te' ? 'స్పష్టమైన ఫోటో ఎలా తీయాలి (సూచనలు):' : 'How To Capture An Evidence-Grade Photo:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-rose-950">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                        <span>Hold phone steady with both hands or rest elbows on your chest to eliminate camera shake.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                        <span>Keep camera 15–20 cm away from the affected leaf in bright, indirect daylight (avoid harsh noon sun).</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                        <span>Frame the leaf so it fills at least 50% of the screen (avoid distant shots showing mostly soil).</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                        <span>Wipe the camera lens with a clean microfiber cloth before snapping the photo.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* USABLE EVIDENCE: LIKELY CONDITION / DISEASE CARD */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#214E34] text-white">
                        {t.scan.likelyConditionTitle}
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        [{scanResult.cropType} • {scanResult.growthStage.toUpperCase()}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#1E4D30] border border-[#2E6B43]/40 shadow-xs">
                        {language === 'te' ? scanResult.managementAdvice.confidenceWordingTe : scanResult.managementAdvice.confidenceWordingEn}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#153421] font-serif tracking-tight flex items-center gap-2">
                      {scanResult.managementAdvice.conditionCategory === 'healthy_crop' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-[#2C6941] flex-shrink-0" />
                      )}
                      <span>
                        {language === 'te' ? scanResult.managementAdvice.likelyConditionTe : scanResult.managementAdvice.likelyConditionEn}
                      </span>
                    </h3>
                    <p className="text-xs text-[#4F6456] mt-1 font-sans">
                      Diagnostic Posture: Observational decision support derived from real pixel segmentation, spatial lesion clusters, and growth stage. Image-based analysis alone does not constitute laboratory culture.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                    {/* Supporting Visual Evidence ("Why") */}
                    <div className="md:col-span-7 p-4 bg-white rounded-2xl border border-[#D8E4DC] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B4029]">
                        <Info className="w-4 h-4 text-[#2E6B43]" />
                        <span>{language === 'te' ? 'ఎందుకు అనుమానించబడుతోంది (దృశ్య ఆధారాలు):' : 'Why It Is Suspected (CV Evidence):'}</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                        {(language === 'te' ? scanResult.managementAdvice.whyEvidenceTe : scanResult.managementAdvice.whyEvidenceEn).map((reason, ri) => (
                          <li key={ri} className="leading-relaxed">{reason}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Still Needed for Field Confirmation */}
                    <div className="md:col-span-5 p-4 bg-[#FAF9F5] rounded-2xl border border-[#DFD8C9] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4E3D2A]">
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span>{language === 'te' ? 'క్షేత్ర నిర్ధారణకు ఇంకా కావలసినవి:' : 'Still Needed for Field Confirmation:'}</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#524433] list-disc pl-4">
                        {(language === 'te' ? scanResult.managementAdvice.stillNeededForConfirmationTe : scanResult.managementAdvice.stillNeededForConfirmationEn).map((item, ii) => (
                          <li key={ii} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. RELATIVE HYPOTHESIS RANKING (DIFFERENTIAL) */}
          {scanResult.hypotheses.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE5E0] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1B3E2A] font-serif uppercase tracking-wider">
                    {t.scan.relativeHypothesisRankingTitle}
                  </h3>
                  <p className="text-xs text-[#4C5F53] mt-1 font-sans font-medium">
                    {t.scan.relativeHypothesisRankingDisclaimer}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F2EA] text-[#214E34] border border-[#BED4C4] self-start sm:self-auto font-mono">
                  Differential Model
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scanResult.hypotheses.map((hyp, index) => (
                  <div
                    key={hyp.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      index === 0
                        ? 'border-[#2C6941] bg-[#F7FAF8] shadow-sm ring-1 ring-[#2C6941]/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Rank #{index + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                            Score
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#214E34] text-white">
                            {hyp.currentProbability}%
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-[#163623] leading-snug">
                        {language === 'te' ? hyp.titleTe : hyp.titleEn}
                      </h4>

                      {/* Supporting Visual Evidence */}
                      <div className="p-2.5 rounded-lg bg-white/80 border border-gray-200/80 text-xs text-gray-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                          Supporting Visual Evidence:
                        </span>
                        <p className="leading-relaxed">
                          {language === 'te' ? hyp.visualEvidenceTe : hyp.visualEvidenceEn}
                        </p>
                      </div>

                      {/* What is still missing */}
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                          {t.scan.whatIsMissingLabel}
                        </span>
                        <p className="leading-relaxed">
                          {language === 'te' ? (hyp.whatIsMissingTe || hyp.whyConsideredTe) : (hyp.whatIsMissingEn || hyp.whyConsideredEn)}
                        </p>
                      </div>

                      {/* Distinguishing field observation */}
                      {hyp.distinguishingObservationEn && (
                        <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200/60 text-xs text-sky-950 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            {t.scan.distinguishingObservationLabel}
                          </span>
                          <p className="leading-relaxed">
                            {language === 'te' ? (hyp.distinguishingObservationTe || hyp.distinguishingObservationEn) : hyp.distinguishingObservationEn}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                        {language === 'te' ? 'క్షేత్ర తనిఖీ అంశాలు:' : 'Field Verification Checklist:'}
                      </span>
                      <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-3.5">
                        {(language === 'te' ? hyp.recommendedObservationsTe : hyp.recommendedObservationsEn).map((obs, oi) => (
                          <li key={oi}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. INTERACTIVE AGENT DECISION CYCLE: FOLLOW-UP QUESTIONS */}
          {scanResult.followUpQuestions.length > 0 && (
            <div className="bg-[#FAF8F3] p-6 rounded-2xl border border-[#DFD7C8] shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#2F2418] font-serif flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#8A5A27]" />
                    <span>{t.scan.questionsPromptTitle}</span>
                  </h3>
                  <p className="text-xs text-[#6B5A49] mt-0.5">
                    {t.scan.questionsPromptSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="px-4 py-2 rounded-xl bg-[#214E34] text-white text-xs font-bold hover:bg-[#183B27] transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#A3E635]" />
                  <span>{t.scan.recalculateButton}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scanResult.followUpQuestions.map(q => (
                  <div key={q.id} className="p-4 rounded-xl bg-white border border-[#DDD5C5] space-y-3">
                    <span className="text-xs font-bold text-gray-800 leading-snug block">
                      {language === 'te' ? q.questionTe : q.questionEn}
                    </span>
                    <div className="space-y-1.5">
                      {q.options.map(opt => (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            userAnswers[q.id] === opt.value
                              ? 'border-[#2C6941] bg-[#E8F2EA] text-[#183E28] font-bold'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={userAnswers[q.id] === opt.value}
                            onChange={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                            className="mt-0.5 text-[#214E34] focus:ring-[#214E34]"
                          />
                          <span>{language === 'te' ? opt.labelTe : opt.labelEn}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ADAPTIVE AGENT DECISION TRACE (7-STAGE WORKFLOW) */}
          <div className="bg-white p-6 rounded-2xl border border-[#DDE5E0] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-[#1B3E2A] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2C6941]" />
                <span>{t.scan.agentTraceTitle}</span>
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                {scanResult.agentTrace.length} Stages Executed
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D0DDD4]">
              {scanResult.agentTrace.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Dot indicator */}
                  <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                    step.status === 'critical'
                      ? 'bg-rose-600'
                      : step.status === 'warning'
                      ? 'bg-amber-500'
                      : step.status === 'question_pending'
                      ? 'bg-sky-500'
                      : 'bg-emerald-600'
                  }`} />

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-gray-100 text-gray-700">
                      [{step.phase}]
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {language === 'te' ? step.titleTe : step.titleEn}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono ml-auto">
                      {step.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {language === 'te' ? step.detailsTe : step.detailsEn}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {step.evidenceTags.map((tag, ti) => (
                      <span key={ti} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#EBF2ED] text-[#224A32]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. RECOMMENDED MANAGEMENT & TREATMENT SECTION (6-POINT STRUCTURED PLAN) */}
          {scanResult.managementAdvice && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DDE5E0] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#1B3E2A] font-serif uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2C6A41]" />
                    <span>{t.scan.managementSectionTitle}</span>
                  </h3>
                  <p className="text-xs text-[#516356] mt-0.5">
                    {t.scan.managementSectionSubtitle}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F2EA] text-[#214E34] border border-[#BED4C4] font-mono self-start sm:self-auto">
                  6-Point Protocol
                </span>
              </div>

              {/* 6 Structured Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Immediate Steps Today */}
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE7E0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#214E34] text-white flex items-center justify-center text-xs font-bold">1</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183925]">
                      {language === 'te' ? 'రైతు వెంటనే చేయవలసిన తక్షణ పనులు' : 'Immediate Steps The Farmer Can Take Today'}
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-5">
                    {(scanResult.managementAdvice.sixPointPlan?.immediateSteps[language] || scanResult.managementAdvice.immediateStepsEn).map((step, si) => (
                      <li key={si} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. Environmental & Irrigation Management */}
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE7E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#214E34] text-white flex items-center justify-center text-xs font-bold">2</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#183925]">
                        {language === 'te' ? 'నీటి యాజమాన్యం & వాతావరణం' : 'Environmental & Irrigation Management'}
                      </h4>
                    </div>
                    {sensorData && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-lime-100 text-lime-900 border border-lime-300">
                        Moisture: {sensorData.soilMoisture}%
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-5">
                    {(scanResult.managementAdvice.sixPointPlan?.environmentalIrrigation[language] || [
                      'Maintain optimal moisture; avoid standing water in root zones.',
                      'Irrigate early morning to prevent prolonged leaf wetness.'
                    ]).map((step, si) => (
                      <li key={si} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Affected Leaves & Plant Management */}
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE7E0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#214E34] text-white flex items-center justify-center text-xs font-bold">3</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183925]">
                      {language === 'te' ? 'దెబ్బతిన్న ఆకులు & మొక్కల సంరక్షణ' : 'Management of Affected Leaves / Plants'}
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-5">
                    {(scanResult.managementAdvice.sixPointPlan?.affectedPlantManagement[language] || [
                      'Prune and bag severely blighted lower leaves touching soil.',
                      'Disinfect shears with 70% isopropyl alcohol between plant rows.'
                    ]).map((step, si) => (
                      <li key={si} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Prevention Measures */}
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE7E0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#214E34] text-white flex items-center justify-center text-xs font-bold">4</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183925]">
                      {language === 'te' ? 'ముందస్తు నివారణ చర్యలు (భవిష్యత్తు పంటల కోసం)' : 'Preventive Measures for Future Protection'}
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-5">
                    {(scanResult.managementAdvice.sixPointPlan?.preventionMeasures[language] || scanResult.managementAdvice.preventionStepsEn).map((step, si) => (
                      <li key={si} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. Monitoring & Follow-Up (48-72h) */}
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE7E0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#214E34] text-white flex items-center justify-center text-xs font-bold">5</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183925]">
                      {language === 'te' ? 'పర్యవేక్షణ & తదుపరి పరిశీలన (48-72 గంటలు)' : 'Monitoring & Follow-Up (48–72 Hours)'}
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-5">
                    {(scanResult.managementAdvice.sixPointPlan?.monitoringFollowUp[language] || [
                      'Monitor tagged plants in 48–72 hours to verify lesion expansion.',
                      'Check if emerging new vegetative shoots remain symptom-free.'
                    ]).map((step, si) => (
                      <li key={si} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                {/* 6. When to Seek Local Expert Confirmation */}
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE7E0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#214E34] text-white flex items-center justify-center text-xs font-bold">6</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183925]">
                      {language === 'te' ? 'వ్యవసాయ నిపుణుడిని / KVK ని ఎప్పుడు సంప్రదించాలి' : 'When To Contact Agricultural Expert / KVK'}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {scanResult.managementAdvice.sixPointPlan?.expertConfirmation[language] || scanResult.managementAdvice.whenToSeekHelpEn}
                  </p>
                </div>
              </div>

              {/* Mandatory Pesticide Safety Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>{t.scan.safetyNoticeHeader}</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {language === 'te'
                    ? 'ముఖ్యమైన భద్రతా నియమం: తక్కువ ప్రమాదం గల, సేంద్రీయ, జీవ నియంత్రణ పద్ధతులకు ప్రాధాన్యత ఇవ్వండి. ఒకవేళ రసాయన మందుల అవసరం ఏర్పడితే, మీ పంటకు స్థానికంగా సిఫార్సు చేయబడిన మందులను మాత్రమే ఉత్పత్తి లేబుల్ లేదా వ్యవసాయ విస్తరణ అధికారి (AEO) సూచనల ప్రకారం వాడండి. లేబుల్ సూచించిన మోతాదు కంటే ఎక్కువ వాడవద్దు.'
                    : 'Important Safety Rule: Cultural, biological, and non-chemical practices should always be prioritized first. If chemical treatments are considered, use only a locally approved treatment recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional. Never exceed labeled concentrations or spray unverified chemicals.'}
                </p>
              </div>
            </div>
          )}

          {/* 6. PROMINENT ASK VOICE AGRONOMIST CALLOUT NEAR DIAGNOSTIC RESULTS & NEXT STEPS */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#173D26] via-[#1E4D30] to-[#255C3A] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg border border-[#367850]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎙️</span>
                <h4 className="text-base sm:text-lg font-extrabold font-serif text-[#FBF9F5] tracking-tight">
                  {language === 'te' ? 'Ask Voice Agronomist (వాయిస్ అగ్రోనమిస్ట్‌ని అడగండి)' : 'Ask Voice Agronomist'}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A3E635] text-[#122A1C] uppercase tracking-wider">
                  Interactive Audio
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#D4E8DC] max-w-xl leading-relaxed">
                {language === 'te'
                  ? `మీ ${scanResult.cropType} ఆకు స్కాన్ ఫలితాలు, ${scanResult.managementAdvice?.likelyConditionTe || 'పరిస్థితి'} మరియు 6-దశల నివారణ ప్రణాళికపై నేరుగా తెలుగు లేదా ఇంగ్లీష్‌లో మాట్లాడి ప్రశ్నలు అడగండి.`
                  : `Discuss your ${scanResult.cropType} scan results, ${scanResult.managementAdvice?.likelyConditionEn || 'condition'}, and the 6-point management plan directly with our Voice Agronomist in English or Telugu.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-[#A3E635] hover:bg-[#8CD31E] text-[#122A1C] text-sm font-extrabold flex items-center gap-2 transition-all shadow-md flex-shrink-0 cursor-pointer"
            >
              <span className="text-base">🎙️</span>
              <span>{language === 'te' ? 'Ask Voice Agronomist' : 'Ask Voice Agronomist'}</span>
            </button>
          </div>

          {/* 7. PRACTICAL NEXT STEPS */}
          <div className="bg-[#FAFBF9] p-6 rounded-2xl border border-[#D5E0D8] shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#1B3E2A] uppercase tracking-wider">
              {t.scan.practicalNextStepsTitle}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
              <li className="flex items-start gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'te'
                    ? 'ఆకు వెనుక భాగంలో తెల్లటి బూజు లేదా పురుగులు ఉన్నాయో భూతద్దంతో చూడండి.'
                    : 'Check lower leaf undersides with a hand lens for powdery mycelium, fungal spores, or spider mite webbing.'}
                </span>
              </li>
              <li className="flex items-start gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'te'
                    ? 'మొక్క మొదట్లో నేల చాలా తడిగా ఉందా లేదా ఎండిపోయిందా వేర్ల వద్ద తనిఖీ చేయండి.'
                    : 'Inspect root zone soil moisture at 10-15 cm depth to ensure no waterlogging or root hypoxia.'}
                </span>
              </li>
              <li className="flex items-start gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'te'
                    ? 'పసుపు రంగు కేవలం క్రింది ఆకులకే పరిమితమైతే నత్రజని లేదా పాత ఆకుల సహజ మార్పు కావచ్చు.'
                    : 'If chlorosis is strictly restricted to bottom-most mature leaves, evaluate mobile nutrient (Nitrogen/Potassium) depletion.'}
                </span>
              </li>
              <li className="flex items-start gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'te'
                    ? 'తీవ్రమైన వ్యాధి అనుమానం ఉంటే స్థానిక వ్యవసాయ అధికారి లేదా కృషి విజ్ఞాన కేంద్రాన్ని (KVK) సంప్రదించండి.'
                    : 'For persistent or plot-wide symptoms, bring a fresh leaf sample in a sealed paper bag to your local KVK or university extension agronomist.'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Voice Agronomist Modal with Scan Context */}
      <VoiceAgronomistModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onToggleLanguage={onToggleLanguage}
        scanContext={scanResult}
        sensorData={sensorData}
        onShowToast={onShowToast}
      />
    </div>
  );
};
