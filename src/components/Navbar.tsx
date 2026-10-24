import React, { useState } from 'react';
import { Language, SensorReading } from '../types';
import { translations } from '../utils/translations';
import {
  Sprout,
  ScanLine,
  GitCompare,
  MessageSquareQuote,
  BookOpenText,
  FileCheck2,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  Languages,
  Activity
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  sensorData: SensorReading | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  language,
  onToggleLanguage,
  sensorData
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'scan', label: t.nav.scan, icon: ScanLine },
    { id: 'compare', label: t.nav.compare, icon: GitCompare },
    { id: 'ask', label: t.nav.ask, icon: MessageSquareQuote },
    { id: 'diary', label: t.nav.diary, icon: BookOpenText },
    { id: 'reports', label: t.nav.reports, icon: FileCheck2 },
    { id: 'settings', label: t.nav.settings, icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#1A3D29] text-white shadow-md border-b border-[#2B543D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#286040] flex items-center justify-center border border-[#3E8058] shadow-inner group-hover:bg-[#32734E] transition-colors">
              <Sprout className="w-6 h-6 text-[#A3E635]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#FBF9F5] font-serif">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#A3E635] text-[#122A1C] uppercase tracking-wider">
                  CV Engine
                </span>
              </div>
              <p className="text-[11px] text-[#A5C4B0] font-sans hidden sm:block leading-none">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#295F3F] text-white shadow-sm border border-[#3E8058]'
                      : 'text-[#D0E2D6] hover:bg-[#204932] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#A3E635]' : 'text-[#8DB49B]'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Utilities: Sensor Telemetry Pill + Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sensor Telemetry Indicator */}
            <div
              onClick={() => onSelectTab('dashboard')}
              title="Real-time IoT Field Sensor Status"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#132D1E] border border-[#2B573C] cursor-pointer hover:border-[#A3E635]/60 transition-colors"
            >
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
              </div>
              <span className="text-[11px] font-mono text-[#D7E8DC] hidden md:inline">
                {sensorData
                  ? sensorData.isSimulated
                    ? `Demo: ${sensorData.soilMoisture}%`
                    : `Moist: ${sensorData.soilMoisture}%`
                  : 'IoT Live'}
              </span>
              <Activity className="w-3.5 h-3.5 text-lime-400 sm:hidden" />
            </div>

            {/* Language Switcher Button */}
            <button
              onClick={() => onToggleLanguage(language === 'en' ? 'te' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#27533A] hover:bg-[#316447] text-white text-xs font-semibold border border-[#3E7A56] transition-colors"
              title="Switch language between English and Telugu"
            >
              <Languages className="w-3.5 h-3.5 text-[#A3E635]" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#D0E2D6] hover:bg-[#235036] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#163623] border-t border-[#2B543D] px-4 pt-2 pb-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#286040] text-white border border-[#3D8058]'
                    : 'text-[#D0E2D6] hover:bg-[#1E4830]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#A3E635]' : 'text-[#8DB49B]'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
