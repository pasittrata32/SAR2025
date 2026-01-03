
import React, { useState, useEffect } from 'react';
import { AchievementLevel, AchievementType, CertificateEntry, Language } from '../types';
import { DEPARTMENTS, PREFIXES, LEVELS, STANDARDS, ACADEMIC_YEAR, TRANSLATIONS } from '../constants';
import { saveEntry, getEntries } from '../services/storageService';
import LocalizedDatePicker from './LocalizedDatePicker';

interface TeacherFormProps {
  lang: Language;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ lang }) => {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSingleDay, setIsSingleDay] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [historyResults, setHistoryResults] = useState<CertificateEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const t = TRANSLATIONS[lang];

  const getInitialFormState = () => ({
    prefix: PREFIXES[lang][0],
    fullName: '',
    position: '',
    department: DEPARTMENTS[lang][0],
    selectedLevels: [] as string[],
    activityName: '',
    type: AchievementType.TRAINING,
    organization: '',
    level: AchievementLevel.SCHOOL,
    dateStart: '',
    dateEnd: '',
    imageData: '',
    selectedStandards: [] as string[]
  });

  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    // อัปเดตเฉพาะค่าพื้นฐานเมื่อเปลี่ยนภาษา
    setFormData(prev => ({ 
      ...prev, 
      department: DEPARTMENTS[lang][0],
      prefix: PREFIXES[lang][0]
    }));
  }, [lang]);

  useEffect(() => {
    if (isSingleDay && formData.dateStart) {
      setFormData(prev => ({ ...prev, dateEnd: prev.dateStart }));
    }
  }, [isSingleDay, formData.dateStart]);

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setHistoryResults([]);
      setHasSearched(false);
      return;
    }
    const allEntries = await getEntries();
    const filtered = allEntries.filter(entry => 
      entry.teacher.fullName.toLowerCase().includes(searchName.toLowerCase().trim())
    );
    setHistoryResults(filtered);
    setHasSearched(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/jpeg') {
        alert(lang === 'TH' ? 'กรุณาแนบไฟล์ JPEG เท่านั้น' : 'Please attach JPEG file only');
        e.target.value = '';
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageData: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLevels: prev.selectedLevels.includes(level) 
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level]
    }));
  };

  const toggleStandard = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStandards: prev.selectedStandards.includes(id)
        ? prev.selectedStandards.filter(s => s !== id)
        : [...prev.selectedStandards, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageData) {
      alert(lang === 'TH' ? 'กรุณาแนบไฟล์เกียรติบัตร' : 'Please attach certificate file');
      return;
    }
    if (formData.selectedStandards.length === 0) {
      alert(lang === 'TH' ? 'กรุณาเลือกตัวชี้วัดที่เกี่ยวข้องอย่างน้อย 1 รายการ' : 'Please select at least 1 related indicator');
      return;
    }

    const newEntry: CertificateEntry = {
      id: Math.random().toString(36).substr(2, 9),
      teacher: {
        prefix: formData.prefix,
        fullName: formData.fullName,
        position: formData.position,
        department: formData.department,
        levels: formData.selectedLevels
      },
      activityName: formData.activityName,
      type: formData.type,
      organization: formData.organization,
      level: formData.level,
      dateStart: formData.dateStart,
      dateEnd: formData.dateEnd || formData.dateStart,
      imageData: formData.imageData,
      selectedStandards: formData.selectedStandards,
      status: 'PENDING',
      submittedAt: Date.now()
    };

    await saveEntry(newEntry);
    
    // แสดง Popup แจ้งเตือน
    setShowSuccessPopup(true);
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    
    // รีเซ็ตฟอร์ม (ยกเว้นข้อมูลส่วนตัวเพื่อให้กรอกต่อเนื่องได้ง่าย)
    setFormData(prev => ({
      ...getInitialFormState(),
      prefix: prev.prefix,
      fullName: prev.fullName,
      position: prev.position,
      department: prev.department,
      selectedLevels: prev.selectedLevels
    }));
    
    setIsSingleDay(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // อัปเดตประวัติการส่งทันทีถ้ามีการเปิดหน้าต่างประวัติไว้
    if (hasSearched) {
      handleSearch();
    }
  };

  const standardGroup1 = STANDARDS.filter(s => s.group === 1);
  const standardGroup2 = STANDARDS.filter(s => s.group === 2);

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 space-y-8 pb-12">
      {/* Popup Success Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 border-t-8 border-green-500 transform animate-scaleIn">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.success}</h2>
            <p className="text-slate-600 mb-6">{t.successSubtitle}</p>
            <button 
              onClick={handleClosePopup}
              className="w-full bg-[#002147] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition shadow-lg"
            >
              {lang === 'TH' ? 'ตกลง (กรอกข้อมูลต่อ)' : 'OK (Continue)'}
            </button>
          </div>
        </div>
      )}

      {/* Search History Section */}
      <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-4 border-b">
          <h3 className="text-sm font-bold text-[#002147] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t.checkHistory}
          </h3>
        </div>
        <div className="p-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row gap-2">
            <input 
              type="text" 
              className="flex-grow p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147] text-sm"
              placeholder={t.searchPlaceholder}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="bg-[#002147] text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-md"
            >
              {lang === 'TH' ? 'ค้นหา' : 'Search'}
            </button>
          </div>

          {hasSearched && (
            <div className="mt-4 animate-fadeIn">
              {historyResults.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">{t.historyFound} ({historyResults.length})</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                    {historyResults.map(entry => (
                      <div key={entry.id} className="p-3 border rounded bg-slate-50 flex flex-col gap-1 text-left">
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{entry.activityName}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>{t.submittedDate}: {new Date(entry.submittedAt).toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-US')}</span>
                          <span className={`px-2 py-0.5 rounded-full ${entry.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {entry.status === 'APPROVED' ? t.approved : t.pending}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded text-center text-sm text-slate-500 italic">
                  {t.noHistory}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-[#002147] text-white p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold">{t.formTitle} ({ACADEMIC_YEAR})</h2>
          <p className="text-sm opacity-80">{t.formSubtitle}</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Section 1: Teacher Info */}
          <section>
            <h3 className="text-lg font-semibold border-l-4 border-[#002147] pl-3 mb-4">{t.personalInfo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.prefix}</label>
                <select 
                  required 
                  className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#002147]" 
                  value={formData.prefix} 
                  onChange={e => setFormData({...formData, prefix: e.target.value})}
                >
                  {PREFIXES[lang].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t.fullName}</label>
                <input required type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147]" placeholder={lang === 'TH' ? "กรอกชื่อและนามสกุล" : "Enter your full name"}
                  value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.position}</label>
                <input required type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147]" placeholder={lang === 'TH' ? "เช่น ครู, เจ้าหน้าที่" : "e.g., Teacher, Officer"}
                  value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.department}</label>
                <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147] bg-white" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  {DEPARTMENTS[lang].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">{t.teachingLevel}</label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map(l => (
                  <button key={l} type="button" 
                    onClick={() => toggleLevel(l)}
                    className={`px-4 py-2 text-xs rounded-full border transition font-semibold ${formData.selectedLevels.includes(l) ? 'bg-[#002147] text-white border-[#002147]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Achievement Info */}
          <section>
            <h3 className="text-lg font-semibold border-l-4 border-[#002147] pl-3 mb-4">{t.achievementInfo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t.activityName}</label>
                <input required type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147]" placeholder={lang === 'TH' ? "ชื่อกิจกรรมตามเกียรติบัตร" : "Activity name on certificate"}
                  value={formData.activityName} onChange={e => setFormData({...formData, activityName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.type}</label>
                <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147] bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as AchievementType})}>
                  {Object.values(AchievementType).map(t_val => (
                    <option key={t_val} value={t_val}>{(t.types as any)[t_val] || t_val}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.level}</label>
                <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147] bg-white" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as AchievementLevel})}>
                  {Object.values(AchievementLevel).map(l_val => (
                    <option key={l_val} value={l_val}>{(t.levels as any)[l_val] || l_val}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t.organization}</label>
                <input required type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#002147]" placeholder={lang === 'TH' ? "เช่น สพฐ., กระทรวงศึกษาธิการ" : "e.g., MOE, School Board"}
                  value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} />
              </div>

              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="singleDayCheckbox"
                    className="w-5 h-5 cursor-pointer accent-[#002147]" 
                    checked={isSingleDay} 
                    onChange={(e) => setIsSingleDay(e.target.checked)} 
                  />
                  <label htmlFor="singleDayCheckbox" className="text-sm font-bold text-slate-700 cursor-pointer">
                    {t.singleDayEvent}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">{t.startDate}</label>
                    <LocalizedDatePicker
                      lang={lang}
                      value={formData.dateStart}
                      onChange={(val) => setFormData({...formData, dateStart: val})}
                      placeholder={t.datePlaceholder}
                      required
                    />
                  </div>
                  
                  {!isSingleDay && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-medium mb-1 text-slate-600">{t.endDate}</label>
                      <LocalizedDatePicker
                        lang={lang}
                        value={formData.dateEnd}
                        onChange={(val) => setFormData({...formData, dateEnd: val})}
                        placeholder={t.datePlaceholder}
                        required
                      />
                      {formData.dateStart && !formData.dateEnd && (
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, dateEnd: prev.dateStart }))}
                          className="mt-1 text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          * {t.sameAsStart}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Standards / Indicators */}
          <section>
            <h3 className="text-lg font-semibold border-l-4 border-[#002147] pl-3 mb-4">{t.standardsLink}</h3>
            
            <div className="space-y-8">
              {[
                { title: t.stdGroup1, items: standardGroup1, theme: 'blue' },
                { title: t.stdGroup2, items: standardGroup2, theme: 'orange' }
              ].map(group => (
                <div key={group.title}>
                  <h4 className={`text-base font-bold text-[#002147] mb-4 bg-${group.theme}-50 p-3 rounded-lg border-l-4 border-${group.theme}-500`}>{group.title}</h4>
                  <div className="space-y-4 pl-2">
                    {group.items.map(s => (
                      <div 
                        key={s.id} 
                        className={`p-5 rounded-xl border-2 transition-all duration-200 shadow-sm ${formData.selectedStandards.includes(s.id) ? `bg-${group.theme}-50 border-${group.theme}-400 ring-2 ring-${group.theme}-100` : 'bg-white border-slate-100 hover:border-slate-300'}`}
                      >
                        <div className="flex items-start gap-4 mb-3">
                          <input 
                            type="checkbox" 
                            className={`mt-1 w-6 h-6 accent-[#002147] flex-shrink-0 cursor-pointer`} 
                            checked={formData.selectedStandards.includes(s.id)} 
                            onChange={() => toggleStandard(s.id)} 
                          />
                          <div className="flex-grow">
                            <span className={`text-base leading-tight font-bold block ${formData.selectedStandards.includes(s.id) ? (group.theme === 'blue' ? 'text-[#002147]' : 'text-orange-900') : 'text-slate-800'}`}>
                              {lang === 'TH' ? s.label : s.labelEn}
                            </span>
                          </div>
                        </div>
                        
                        {/* Information Section - Always Visible */}
                        <div className="ml-10 space-y-4">
                          {(lang === 'TH' ? s.details : s.detailsEn) && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <h5 className="text-xs font-bold text-[#002147] mb-1 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {t.detailsLabel}
                              </h5>
                              <p className="text-[13px] text-slate-600 leading-relaxed">
                                {lang === 'TH' ? s.details : (s.detailsEn || s.details)}
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(lang === 'TH' ? s.application : s.applicationEn) && (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <h5 className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {t.applicationLabel}
                                </h5>
                                <p className="text-[12px] text-slate-600 leading-snug">
                                  {lang === 'TH' ? s.application : (s.applicationEn || s.application)}
                                </p>
                              </div>
                            )}
                            {(lang === 'TH' ? s.evidence : s.evidenceEn) && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <h5 className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                  {t.evidenceLabel}
                                </h5>
                                <p className="text-[12px] text-slate-600 italic leading-snug">
                                  "{lang === 'TH' ? s.evidence : (s.evidenceEn || s.evidence)}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: File Upload */}
          <section>
            <h3 className="text-lg font-semibold border-l-4 border-[#002147] pl-3 mb-4">{t.attachment}</h3>
            <div className="mt-2 flex justify-center px-6 pt-8 pb-10 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition duration-200">
              <div className="space-y-1 text-center">
                {formData.imageData ? (
                  <div className="relative group inline-block">
                    <img src={formData.imageData} alt="Preview" className="max-h-80 mx-auto rounded-lg shadow-xl border-4 border-white" />
                    <button type="button" onClick={() => setFormData({...formData, imageData: ''})}
                      className="absolute -top-3 -right-3 bg-red-600 text-white w-8 h-8 rounded-full text-sm shadow-xl flex items-center justify-center font-bold hover:bg-red-700 transition">✕</button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-16 w-16 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex flex-col text-sm text-slate-600 mt-2">
                      <label className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500 focus-within:outline-none p-2 border border-blue-100 shadow-sm mx-auto mb-2">
                        <span>{t.upload}</span>
                        <input type="file" className="sr-only" accept="image/jpeg" onChange={handleImageChange} />
                      </label>
                      <p className="pl-1">{t.orDrag}</p>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">JPEG (JPG) เท่านั้น</p>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="bg-slate-50 p-6 flex flex-col md:flex-row justify-end gap-3 border-t">
          <button type="reset" onClick={() => {
            setFormData(getInitialFormState());
            setIsSingleDay(false);
          }} className="px-6 py-3 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition font-bold">
            {t.clear}
          </button>
          <button type="submit" disabled={isUploading} className={`px-10 py-3 bg-[#002147] text-white rounded-lg font-bold hover:bg-blue-900 transition shadow-lg text-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isUploading ? t.uploading : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
