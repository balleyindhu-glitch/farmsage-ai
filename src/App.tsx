import React, { useState, useEffect } from 'react';
import {
  Language,
  CropScanRecord,
  SensorReading,
  ToastMessage
} from './types';
import { translations } from './utils/translations';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CropScanner } from './components/CropScanner';
import { CompareView } from './components/CompareView';
import { AskFarmSage } from './components/AskFarmSage';
import { CropDiary } from './components/CropDiary';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { NotificationToastContainer } from './components/NotificationToast';
import { VoiceAgronomistModal } from './components/VoiceAgronomistModal';
import { generateSampleLeafImage } from './utils/sampleImages';
import { processCropImage } from './utils/cvEngine';
import { runAgentDecisionProcess } from './utils/agentProcess';
import { Sprout, ShieldAlert, Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('farmsage_lang');
    return saved === 'te' ? 'te' : 'en';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [dashboardVoiceModalOpen, setDashboardVoiceModalOpen] = useState(false);
  const [diaryScans, setDiaryScans] = useState<CropScanRecord[]>(() => {
    try {
      const stored = localStorage.getItem('farmsage_scans');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed parsing stored scans:', e);
    }
    return [];
  });

  const t = translations[language];

  // Helper to show toasts
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setToasts(prev => [...prev.slice(-4), newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  };

  // Sync language to localStorage
  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('farmsage_lang', lang);
    addToast({
      title: lang === 'te' ? 'భాష మార్చబడింది' : 'Language Updated',
      message: lang === 'te' ? 'ఇంటర్‌ఫేస్ తెలుగులోకి మార్చబడింది.' : 'Interface switched to English.',
      type: 'info'
    });
  };

  // Save scan to diary and localStorage
  const handleSaveToDiary = (record: CropScanRecord) => {
    setDiaryScans(prev => {
      const updated = [record, ...prev.filter(s => s.id !== record.id)];
      try {
        localStorage.setItem('farmsage_scans', JSON.stringify(updated.slice(0, 30)));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      return updated;
    });
  };

  const handleDeleteScan = (id: string) => {
    setDiaryScans(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('farmsage_scans', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    addToast({
      title: language === 'te' ? 'తొలగించబడింది' : 'Deleted',
      message: language === 'te' ? 'స్కాన్ రికార్డు తొలగించబడింది.' : 'Scan removed from diary.',
      type: 'info'
    });
  };

  // Fetch initial sensor data from backend
  const fetchSensorData = async () => {
    try {
      const res = await fetch('/api/sensor-data');
      if (res.ok) {
        const json = await res.json();
        if (json.current) {
          setSensorData(json.current);
        }
      }
    } catch (e) {
      // Fallback local initial telemetry if server hasn't booted yet
      if (!sensorData) {
        setSensorData({
          id: 'sns-fallback',
          fieldId: 'Field-North-Block-4',
          cropType: 'Tomato / Paddy',
          timestamp: new Date().toISOString(),
          soilMoisture: 42.5,
          soilTemperature: 24.8,
          airHumidity: 68.0,
          airTemperature: 28.5,
          sunlightLux: 48500,
          nitrogenPpm: 120,
          phosphorusPpm: 45,
          potassiumPpm: 190,
          batteryLevel: 94,
          status: 'optimal'
        });
      }
    }
  };

  // Simulate sensor data trigger
  const handleSimulateSensor = async () => {
    try {
      const res = await fetch('/api/sensor-data/simulate', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.reading) {
          setSensorData(json.reading);
          addToast({
            title: language === 'te' ? 'సెన్సార్ డేటా తాజాకరించబడింది' : 'Sensor Telemetry Updated',
            message: language === 'te'
              ? `తేమ: ${json.reading.soilMoisture}%, ఉష్ణోగ్రత: ${json.reading.airTemperature}°C`
              : `Soil Moisture: ${json.reading.soilMoisture}%, Air Temp: ${json.reading.airTemperature}°C`,
            type: 'info'
          });
        }
      }
    } catch (e) {
      console.warn('Simulation failed:', e);
    }
  };

  // Pre-seed initial sample if diary is empty on first visit so farmers immediately see working features
  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000); // 30s background poll

    if (diaryScans.length === 0) {
      // Seed a verified initial scan
      (async () => {
        try {
          const sampleUrl = generateSampleLeafImage('tomato');
          const cv = await processCropImage(sampleUrl);
          const agent = runAgentDecisionProcess(
            cv.measurements,
            cv.quality,
            'Tomato (Sample Baseline)',
            'vegetative',
            'Chlorosis on lower leaf margin observed following unseasonal rain.'
          );
          const initialRecord: CropScanRecord = {
            id: 'scan_initial_sample',
            timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
            cropType: 'Tomato',
            growthStage: 'vegetative',
            fieldLocation: 'Block-North-4',
            farmerNotes: 'Chlorosis on lower leaf margin observed following unseasonal rain.',
            originalImage: sampleUrl,
            annotatedImage: cv.annotatedImageUrl,
            measurements: cv.measurements,
            quality: cv.quality,
            hypotheses: agent.hypotheses,
            agentTrace: agent.agentTrace,
            followUpQuestions: agent.followUpQuestions
          };
          setDiaryScans([initialRecord]);
          localStorage.setItem('farmsage_scans', JSON.stringify([initialRecord]));
        } catch (e) {
          console.warn('Initial seed sample failed:', e);
        }
      })();
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1E2922]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        sensorData={sensorData}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <Dashboard
            language={language}
            onNavigate={setCurrentTab}
            sensorData={sensorData}
            recentScans={diaryScans}
            onSimulateSensor={handleSimulateSensor}
            onOpenVoiceAgronomist={() => setDashboardVoiceModalOpen(true)}
          />
        )}

        {currentTab === 'scan' && (
          <CropScanner
            language={language}
            onToggleLanguage={handleToggleLanguage}
            onSaveToDiary={handleSaveToDiary}
            onShowToast={addToast}
            sensorData={sensorData}
          />
        )}

        {currentTab === 'compare' && (
          <CompareView
            language={language}
            diaryScans={diaryScans}
            onOpenScan={() => setCurrentTab('scan')}
          />
        )}

        {currentTab === 'ask' && (
          <AskFarmSage
            language={language}
            sensorData={sensorData}
            onShowToast={addToast}
          />
        )}

        {currentTab === 'diary' && (
          <CropDiary
            language={language}
            scans={diaryScans}
            onOpenScan={() => setCurrentTab('scan')}
            onDeleteScan={handleDeleteScan}
            onShowToast={addToast}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            language={language}
            scans={diaryScans}
            onOpenScan={() => setCurrentTab('scan')}
            onShowToast={addToast}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            language={language}
            onToggleLanguage={handleToggleLanguage}
            sensorData={sensorData}
            onSimulateSensor={handleSimulateSensor}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* Dashboard Voice Agronomist Modal */}
      <VoiceAgronomistModal
        isOpen={dashboardVoiceModalOpen}
        onClose={() => setDashboardVoiceModalOpen(false)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        scanContext={diaryScans.length > 0 ? diaryScans[0] : null}
        sensorData={sensorData}
        onShowToast={addToast}
      />

      {/* Global Notification Toast Container */}
      <NotificationToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Footer */}
      <footer className="bg-[#122A1C] text-[#A5C4B0] border-t border-[#1F4630] py-8 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#214E34] flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5 text-[#A3E635]" />
            </div>
            <span className="font-bold text-[#FBF9F5] font-serif">FarmSage AI</span>
            <span>—</span>
            <span>Evidence-Driven Smart Farming Assistant</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-[#8BAE97] space-y-0.5">
            <p>Mathematical Computer Vision • Adaptive Bayesian Agent • Multi-lingual Voice</p>
            <p className="text-amber-300 font-semibold">
              Observational decision-support only • Consult certified agronomists for chemical applications
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
