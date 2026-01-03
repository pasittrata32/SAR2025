
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LocalizedDatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  lang: Language;
  placeholder: string;
  required?: boolean;
}

const LocalizedDatePicker: React.FC<LocalizedDatePickerProps> = ({ 
  value, 
  onChange, 
  lang, 
  placeholder, 
  required
}) => {
  const t = TRANSLATIONS[lang];
  
  // แปลง ISO (YYYY-MM-DD) เป็นรูปแบบแสดงผล (DD/MM/YYYY)
  const toDisplayFormat = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const year = lang === 'TH' ? parseInt(y) + 543 : parseInt(y);
    return `${d}/${m}/${year}`;
  };

  const [inputValue, setInputValue] = useState(toDisplayFormat(value));
  const [preview, setPreview] = useState('');

  // อัปเดตช่องกรอกเมื่อ value ภายนอกเปลี่ยน
  useEffect(() => {
    setInputValue(toDisplayFormat(value));
  }, [value, lang]);

  // สร้างคำอธิบายวันที่แบบเต็ม (Preview)
  useEffect(() => {
    if (!value) {
      setPreview('');
      return;
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        setPreview('');
        return;
      }
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setPreview(date.toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-US', options));
    } catch (e) {
      setPreview('');
    }
  }, [value, lang]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // เอาเฉพาะตัวเลข
    
    // ใส่ / อัตโนมัติ (DD/MM/YYYY)
    if (val.length > 2 && val.length <= 4) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    } else if (val.length > 4) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
    }
    
    setInputValue(val);

    // ตรวจสอบและส่งค่ากลับถ้าครบรูปแบบ 10 หลัก (DD/MM/YYYY)
    if (val.length === 10) {
      const [d, m, y] = val.split('/');
      let yearNum = parseInt(y);
      
      // ตรวจสอบความถูกต้องเบื้องต้นของ วัน และ เดือน
      const dayNum = parseInt(d);
      const monthNum = parseInt(m);
      if (dayNum > 31 || monthNum > 12 || monthNum === 0 || dayNum === 0) return;

      // แปลงปี พ.ศ. เป็น ค.ศ. สำหรับเก็บลง DB
      if (lang === 'TH' && yearNum > 2400) {
        yearNum -= 543;
      }
      
      const isoDate = `${yearNum}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const testDate = new Date(isoDate);
      
      if (!isNaN(testDate.getTime())) {
        onChange(isoDate);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative group">
        <input
          type="text"
          maxLength={10}
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={lang === 'TH' ? "วว/ดด/ปปปป (เช่น 15/05/2568)" : "DD/MM/YYYY (e.g. 15/05/2025)"}
          className="w-full h-12 px-4 border-2 border-slate-200 rounded-lg focus:border-[#002147] focus:ring-0 outline-none transition-all font-medium text-slate-700 bg-white placeholder:text-slate-300 shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Live Preview & Help Text */}
      <div className="flex flex-col gap-1 min-h-[24px]">
        {preview ? (
          <p className="text-xs font-bold text-[#002147] flex items-center gap-1 animate-fadeIn bg-blue-50 py-1 px-2 rounded border border-blue-100 w-fit">
            <span className="text-sm">📅</span> {preview}
          </p>
        ) : inputValue.length > 0 && inputValue.length < 10 ? (
          <p className="text-[10px] text-slate-400 italic">
            {lang === 'TH' ? "* พิมพ์ตัวเลข วัน/เดือน/ปีพุทธศักราช" : "* Type DD/MM/YYYY (AD)"}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default LocalizedDatePicker;
