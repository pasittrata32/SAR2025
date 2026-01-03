
import React, { useState, useEffect } from 'react';
import { CertificateEntry, Language } from '../types';
import { getEntries, updateEntry, deleteEntry, saveSheetUrl } from '../services/storageService';
import ReportGenerator from './ReportGenerator';
import { STANDARDS, TRANSLATIONS } from '../constants';

interface AdminDashboardProps {
  lang: Language;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang }) => {
  const [entries, setEntries] = useState<CertificateEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<CertificateEntry | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printData, setPrintData] = useState<CertificateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');

  const t = TRANSLATIONS[lang];
  const dateLocale = lang === 'TH' ? 'th-TH' : 'en-US';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getEntries();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const config = localStorage.getItem('sar_db_config');
    if (config) {
      const parsed = JSON.parse(config);
      setSheetUrlInput(parsed.url || 'https://script.google.com/macros/s/AKfycbzPSF6QcDIxtwoiysXA8D5tMbuiBoBQkzkAd1HMnDrCmOlEvsVWN69TEzzqQW2xCNEQXw/exec');
    } else {
      setSheetUrlInput('https://script.google.com/macros/s/AKfycbzPSF6QcDIxtwoiysXA8D5tMbuiBoBQkzkAd1HMnDrCmOlEvsVWN69TEzzqQW2xCNEQXw/exec');
    }
  }, []);

  const handleStatusToggle = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      const updated = { ...entry, status: entry.status === 'PENDING' ? 'APPROVED' : 'PENDING' } as CertificateEntry;
      await updateEntry(updated);
      await loadData();
      if (selectedEntry?.id === id) setSelectedEntry(updated);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.confirmDelete)) {
      await deleteEntry(id);
      await loadData();
      setSelectedEntry(null);
    }
  };

  const handleSaveSettings = () => {
    saveSheetUrl(sheetUrlInput);
    setShowSettings(false);
    loadData();
    alert(lang === 'TH' ? 'บันทึกการตั้งค่าฐานข้อมูลแล้ว' : 'Database settings saved');
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-print-area');
    if (!element) return;
    
    // @ts-ignore
    const html2pdf = window.html2pdf;
    if (!html2pdf) {
      alert(lang === 'TH' ? 'ระบบ PDF ยังไม่พร้อมใช้งาน กรุณารอสักครู่และลองใหม่' : 'PDF system is not ready, please wait and try again');
      return;
    }
    
    setIsDownloading(true);
    
    const filename = printData.length === 1 
      ? `Report_${printData[0].teacher.fullName}_${printData[0].activityName.replace(/\s+/g, '_')}.pdf`
      : `SAR_Reports_2025_${new Date().getTime()}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsDownloading(false);
    }).catch((err: any) => {
      console.error('PDF Generation Error:', err);
      setIsDownloading(false);
      alert('Error generating PDF');
    });
  };

  const startPrintSingle = (entry: CertificateEntry) => {
    setPrintData([entry]);
    setShowPrintView(true);
  };

  const startPrintStandard = (stdNum: number) => {
    const filtered = entries.filter(e => e.selectedStandards.some(sid => sid.startsWith(stdNum.toString())));
    if (filtered.length === 0) {
      alert(lang === 'TH' ? 'ไม่พบข้อมูลในมาตรฐานนี้' : 'No data found for this standard');
      return;
    }
    setPrintData(filtered);
    setShowPrintView(true);
  };

  const filteredEntries = entries.filter(e => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  }).sort((a, b) => b.submittedAt - a.submittedAt);

  if (showPrintView) {
    return (
      <div className="page-container min-h-screen">
        <div className="no-print container mx-auto mb-6 flex justify-between items-center p-4 bg-[#002147] text-white rounded-lg shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">{t.printReport}</h3>
              <p className="text-xs opacity-70">จำนวนทั้งหมด {printData.length} รายการ (1 แผ่นต่อรายการ)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPDF} 
              disabled={isDownloading}
              className={`bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDownloading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isDownloading ? (lang === 'TH' ? 'กำลังสร้าง PDF...' : 'Generating...') : t.downloadPDF}
            </button>
            <button onClick={() => window.print()} className="bg-white text-[#002147] hover:bg-slate-100 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t.printReport}
            </button>
            <button onClick={() => setShowPrintView(false)} className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold transition shadow-lg">
              {lang === 'TH' ? 'ย้อนกลับ' : 'Back'}
            </button>
          </div>
        </div>

        <div id="report-print-area">
          {printData.map((e, idx) => (
            <div key={e.id} className={idx > 0 ? 'page-break-before html2pdf__page-break' : ''}>
              <ReportGenerator entry={e} lang={lang} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-[#002147] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {lang === 'TH' ? 'ตั้งค่าฐานข้อมูลออนไลน์' : 'Database Settings'}
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{lang === 'TH' ? 'Google Sheet Web App URL' : 'Google Sheet Web App URL'}</label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#002147] outline-none transition" 
                  placeholder="https://script.google.com/macros/s/..."
                  value={sheetUrlInput}
                  onChange={e => setSheetUrlInput(e.target.value)}
                />
                <p className="mt-2 text-xs text-slate-500 italic">
                  {lang === 'TH' ? '* ระบบใช้ URL ปัจจุบันเป็นฐานข้อมูลหลัก' : '* System uses the current URL as primary database'}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="text-sm font-bold text-[#002147]">{lang === 'TH' ? 'สถานะการเชื่อมต่อ' : 'Connection Status'}</h4>
                  <p className="text-xs text-slate-600 mb-2">
                    {lang === 'TH' ? 'พร้อมใช้งานกับ URL ของคุณแล้ว ข้อมูลจะถูกบันทึกลง Google Sheet โดยตรง' : 'Ready with your URL. Data will be saved directly to Google Sheet.'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                >
                  {lang === 'TH' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 bg-[#002147] text-white rounded-xl font-bold shadow-lg hover:bg-blue-900"
                >
                  {lang === 'TH' ? 'อัปเดตการเชื่อมต่อ' : 'Update Connection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar: List */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-700">{t.entryList}</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 text-slate-400 hover:text-[#002147] transition"
                  title="Database Settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="text-xs p-1 border rounded"
                >
                  <option value="ALL">{t.all}</option>
                  <option value="PENDING">{t.pending}</option>
                  <option value="APPROVED">{t.approved}</option>
                </select>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-[#002147] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-xs text-slate-500">{lang === 'TH' ? 'กำลังโหลดข้อมูลจาก Google Sheet...' : 'Loading from Google Sheet...'}</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-400">{lang === 'TH' ? 'ไม่พบข้อมูล' : 'No data found'}</div>
              ) : (
                filteredEntries.map(e => (
                  <div 
                    key={e.id}
                    onClick={() => setSelectedEntry(e)}
                    className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition ${selectedEntry?.id === e.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.status === 'APPROVED' ? t.approved : t.pending}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(e.submittedAt).toLocaleDateString(dateLocale)}</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{e.activityName}</p>
                    <p className="text-xs text-slate-500">{e.teacher.prefix}{e.teacher.fullName}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg shadow-md border border-slate-200">
            <h4 className="font-bold text-sm mb-3">{t.filterByStandard}</h4>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => startPrintStandard(2)} className="text-xs bg-slate-100 p-2 rounded hover:bg-slate-200 text-center transition font-bold text-slate-700 border border-slate-200">{t.standardShort} 2</button>
              <button onClick={() => startPrintStandard(3)} className="text-xs bg-slate-100 p-2 rounded hover:bg-slate-200 text-center transition font-bold text-slate-700 border border-slate-200">{t.standardShort} 3</button>
            </div>
          </div>
        </div>

        {/* Right Content: Detail */}
        <div className="lg:w-2/3">
          {selectedEntry ? (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
              <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedEntry.activityName}</h2>
                  <p className="text-slate-500">{lang === 'TH' ? 'โดย' : 'By'} {selectedEntry.teacher.prefix}{selectedEntry.teacher.fullName} | {selectedEntry.teacher.position}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleStatusToggle(selectedEntry.id)} className={`px-4 py-1 rounded text-sm font-bold shadow-sm transition ${selectedEntry.status === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'}`}>
                    {selectedEntry.status === 'APPROVED' ? t.statusApproved : t.statusPending}
                  </button>
                  <button onClick={() => startPrintSingle(selectedEntry)} className="bg-[#002147] text-white px-4 py-1 rounded text-sm hover:bg-blue-900 transition shadow-sm font-bold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {t.printReport}
                  </button>
                  <button onClick={() => handleDelete(selectedEntry.id)} className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600 transition shadow-sm font-bold">
                    {t.delete}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded border">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.achievementData}</h4>
                    <p className="text-sm"><strong>{t.type}:</strong> {(t.types as any)[selectedEntry.type] || selectedEntry.type}</p>
                    <p className="text-sm"><strong>{t.level}:</strong> {(t.levels as any)[selectedEntry.level] || selectedEntry.level}</p>
                    <p className="text-sm"><strong>{t.organization}:</strong> {selectedEntry.organization}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-400 font-bold uppercase">{t.startDate} / {t.endDate}</p>
                      <p className="text-sm">
                        {new Date(selectedEntry.dateStart).toLocaleDateString(dateLocale)} - {new Date(selectedEntry.dateEnd).toLocaleDateString(dateLocale)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.linkedStandards}</h4>
                    <ul className="text-xs space-y-2">
                      {selectedEntry.selectedStandards.map(sid => (
                        <li key={sid} className="flex gap-2 items-start">
                          <span className="text-blue-800 font-bold">•</span>
                          <span>{lang === 'TH' ? STANDARDS.find(s => s.id === sid)?.label : STANDARDS.find(s => s.id === sid)?.labelEn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <img src={selectedEntry.imageData} alt="Certificate" className="w-full h-auto rounded shadow-lg border" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-slate-200 text-slate-400">
              {lang === 'TH' ? 'เลือกเกียรติบัตรเพื่อดูรายละเอียดและจัดการ' : 'Select a certificate to view details and manage'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
