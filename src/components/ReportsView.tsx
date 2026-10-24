import React from 'react';
import { Language, CropScanRecord, ToastMessage } from '../types';
import { translations } from '../utils/translations';
import { generateFarmSagePDFReport } from '../utils/pdfGenerator';
import {
  FileCheck2,
  Download,
  Calendar,
  Layers,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ReportsViewProps {
  language: Language;
  scans: CropScanRecord[];
  onOpenScan: (scan: CropScanRecord) => void;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  language,
  scans,
  onOpenScan,
  onShowToast
}) => {
  const t = translations[language];

  const handleDownload = async (scan: CropScanRecord) => {
    try {
      await generateFarmSagePDFReport(scan);
      onShowToast({
        title: language === 'te' ? 'PDF నివేదిక సిద్ధమైంది' : 'PDF Report Ready',
        message: language === 'te' ? 'నివేదిక విజయవంతంగా డౌన్‌లోడ్ చేయబడింది.' : 'Official FarmSage diagnostic report downloaded.',
        type: 'success'
      });
    } catch (err: any) {
      onShowToast({
        title: 'Error',
        message: err?.message || 'Failed to download report',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3E2A] font-serif tracking-tight flex items-center gap-2.5">
          <FileCheck2 className="w-7 h-7 text-[#2C6A41]" />
          <span>{t.reports.title}</span>
        </h1>
        <p className="text-sm text-[#4E6154] mt-1">
          {t.reports.subtitle}
        </p>
      </div>

      {scans.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#DDE5E0] shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {scans.length} Generated Agronomy Report(s)
            </span>
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ Complies with Agricultural Evidence Guidelines
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {scans.map(scan => (
              <div
                key={scan.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAFBF9] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={scan.annotatedImage || scan.originalImage}
                    alt={scan.cropType}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#183925]">
                        FarmSage Diagnostic: {scan.cropType}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F2EA] text-[#214E34] uppercase">
                        {scan.growthStage}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      ID: {scan.id.slice(0, 14)} • {new Date(scan.timestamp).toLocaleString()}
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      {scan.hypotheses.length > 0
                        ? `Leading hypothesis: ${scan.hypotheses[0].titleEn.split('/')[0]} (${scan.hypotheses[0].currentProbability}%)`
                        : 'Computer vision measurements recorded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => onOpenScan(scan)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>View Scan</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(scan)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#214E34] hover:bg-[#183B27] text-white transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#A3E635]" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF9F5] p-12 rounded-3xl border border-dashed border-[#DDD5C5] text-center space-y-3">
          <FileText className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">{t.reports.emptyReports}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {language === 'te'
              ? 'పంటను స్కాన్ చేసిన తర్వాత మీరు కంప్యూటర్ విజన్ కొలతలు, నాణ్యత సూచనలు మరియు ఏజెంట్ వివరణలతో కూడిన పూర్తి PDF నివేదికను పొందవచ్చు.'
              : 'Complete evidence-based PDF reports with original and annotated images, Laplacian metrics, and differential diagnoses are generated upon scanning.'}
          </p>
        </div>
      )}
    </div>
  );
};
