import React, { useState } from 'react';
import { Language, CropScanRecord, ToastMessage } from '../types';
import { translations } from '../utils/translations';
import { generateFarmSagePDFReport } from '../utils/pdfGenerator';
import {
  BookOpenText,
  Search,
  Download,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface CropDiaryProps {
  language: Language;
  scans: CropScanRecord[];
  onOpenScan: (scan: CropScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const CropDiary: React.FC<CropDiaryProps> = ({
  language,
  scans,
  onOpenScan,
  onDeleteScan,
  onShowToast
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('ALL');

  // Unique crops
  const availableCrops = Array.from(new Set(scans.map(s => s.cropType))).filter(Boolean);

  const filteredScans = scans.filter(s => {
    const matchesSearch =
      s.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.farmerNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.fieldLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCrop === 'ALL' || s.cropType === filterCrop;
    return matchesSearch && matchesFilter;
  });

  const handleDownloadPDF = async (scan: CropScanRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await generateFarmSagePDFReport(scan);
      onShowToast({
        title: language === 'te' ? 'నివేదిక డౌన్‌లోడ్' : 'Report Downloaded',
        message: language === 'te' ? 'PDF నివేదిక సిద్ధమైంది.' : 'FarmSage PDF report downloaded.',
        type: 'success'
      });
    } catch (err: any) {
      onShowToast({
        title: 'Error',
        message: err?.message || 'Could not export PDF',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3E2A] font-serif tracking-tight flex items-center gap-2.5">
          <BookOpenText className="w-7 h-7 text-[#2C6A41]" />
          <span>{t.diary.title}</span>
        </h1>
        <p className="text-sm text-[#4E6154] mt-1">
          {t.diary.subtitle}
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.diary.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CCD8D0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#275A38]"
          />
        </div>

        <select
          value={filterCrop}
          onChange={(e) => setFilterCrop(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-[#CCD8D0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#275A38]"
        >
          <option value="ALL">{t.diary.filterAll}</option>
          {availableCrops.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Diary Entries List */}
      {filteredScans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScans.map(scan => (
            <div
              key={scan.id}
              onClick={() => onOpenScan(scan)}
              className="bg-white rounded-2xl border border-[#DDE5E0] shadow-sm overflow-hidden hover:border-[#2C6941] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 bg-black/90 overflow-hidden">
                  <img
                    src={scan.annotatedImage || scan.originalImage}
                    alt={scan.cropType}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                    σ² {scan.measurements.sharpness}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#214E34] text-[#A3E635] text-[10px] font-bold uppercase tracking-wider">
                    {scan.growthStage}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#173F28] group-hover:text-[#2C6941]">
                      {scan.cropType}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {scan.farmerNotes || 'No specific field notes recorded.'}
                  </p>

                  {/* CV Metrics Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Grn: {scan.measurements.greenPercentage}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Ylw: {scan.measurements.yellowPercentage}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                      Brn: {scan.measurements.brownPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-[#FAF9F5] border-t border-[#E8E2D5] flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => handleDownloadPDF(scan, e)}
                  className="flex items-center gap-1 font-bold text-[#214E34] hover:text-[#183B27]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteScan(scan.id);
                  }}
                  className="text-gray-400 hover:text-rose-600 p-1"
                  title="Delete scan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#FAF9F5] p-12 rounded-3xl border border-dashed border-[#DDD5C5] text-center space-y-3">
          <BookOpenText className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">{t.diary.emptyDiary}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {language === 'te'
              ? 'ఆకుల ఫోటోలను స్కాన్ చేసి డైరీలో భద్రపరిస్తే కాలక్రమేణా పంట ఆరోగ్య మార్పులను గమనించవచ్చు.'
              : 'Crop scans saved during your field inspections will appear here with complete CV measurements.'}
          </p>
        </div>
      )}
    </div>
  );
};
