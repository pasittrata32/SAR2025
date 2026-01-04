
import React from 'react';
import { CertificateEntry, Language } from '../types';
import { SCHOOL_NAME, ACADEMIC_YEAR, STANDARDS, TRANSLATIONS } from '../constants';

interface Props {
  entry: CertificateEntry;
  lang: Language;
}

const ReportGenerator: React.FC<Props> = ({ entry, lang }) => {
  const t = TRANSLATIONS[lang];
  const dateLocale = lang === 'TH' ? 'th-TH' : 'en-US';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString(dateLocale, options);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        
        .official-doc {
          font-family: 'Sarabun', sans-serif;
        }
        
        .thai-justify {
          text-align: justify;
          text-justify: distribute-all-lines;
          word-break: break-word;
          overflow-wrap: break-word;
        }
      `}} />

      <div className="official-doc w-[210mm] min-h-[297mm] mx-auto bg-white pt-[20mm] px-[20mm] pb-[20mm] flex flex-col relative box-border shadow-md print:shadow-none print:m-0">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-[14pt] font-bold leading-tight text-black">
            {lang === 'TH' ? 'รายงานผลการปฏิบัติงานและผลงานเพื่อประกอบการประกันคุณภาพการศึกษา' : 'Self-Assessment Report on Performance and Achievements'}
          </h1>
          <h2 className="text-[12pt] font-bold text-black mt-1">{SCHOOL_NAME}</h2>
          <p className="text-[11pt] text-black">{lang === 'TH' ? 'ปีการศึกษา' : 'Academic Year'} {ACADEMIC_YEAR}</p>
        </div>

        {/* 1. Personnel */}
        <div className="mb-4">
          <h3 className="text-[12pt] font-bold border-b border-black pb-0.5 mb-2 text-black">
            {lang === 'TH' ? '๑. ข้อมูลบุคลากร' : '1. Personnel Information'}
          </h3>
          <div className="pl-4 space-y-1">
            <p className="text-[11pt] text-black">
              <span className="font-bold">{lang === 'TH' ? 'ชื่อ-นามสกุล:' : 'Full Name:'}</span> {entry.teacher.prefix}{entry.teacher.fullName}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <p className="text-[11pt] text-black">
                <span className="font-bold">{lang === 'TH' ? 'ตำแหน่ง:' : 'Position:'}</span> {entry.teacher.position}
              </p>
              <p className="text-[11pt] text-black">
                <span className="font-bold">{lang === 'TH' ? 'กลุ่มสาระฯ/ฝ่าย:' : 'Department:'}</span> {entry.teacher.department}
              </p>
            </div>
            <p className="text-[11pt] text-black">
              <span className="font-bold">{lang === 'TH' ? 'ระดับชั้นที่สอน:' : 'Teaching Levels:'}</span> {entry.teacher.levels.join(', ') || '-'}
            </p>
          </div>
        </div>

        {/* 2. Activity */}
        <div className="mb-4">
          <h3 className="text-[12pt] font-bold border-b border-black pb-0.5 mb-2 text-black">
            {lang === 'TH' ? '๒. รายละเอียดผลงานและกิจกรรม' : '2. Achievement & Activity Details'}
          </h3>
          <div className="pl-4 space-y-1">
            <p className="text-[11pt] text-black">
              <span className="font-bold">{lang === 'TH' ? 'หัวข้อกิจกรรม/รางวัล:' : 'Activity Title/Award:'}</span> {entry.activityName}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <p className="text-[11pt] text-black">
                <span className="font-bold">{lang === 'TH' ? 'ประเภท:' : 'Type:'}</span> {(t.types as any)[entry.type] || entry.type}
              </p>
              <p className="text-[11pt] text-black">
                <span className="font-bold">{lang === 'TH' ? 'ระดับผลงาน:' : 'Level:'}</span> {(t.levels as any)[entry.level] || entry.level}
              </p>
            </div>
            <p className="text-[11pt] text-black">
              <span className="font-bold">{lang === 'TH' ? 'หน่วยงานที่เกี่ยวข้อง:' : 'Organization:'}</span> {entry.organization}
            </p>
            <p className="text-[11pt] text-black">
              <span className="font-bold">{lang === 'TH' ? 'ช่วงเวลาดำเนินการ:' : 'Duration:'}</span> {formatDate(entry.dateStart)} {entry.dateStart !== entry.dateEnd ? `${lang === 'TH' ? ' ถึง ' : ' to '} ${formatDate(entry.dateEnd)}` : ''}
            </p>
          </div>
        </div>

        {/* 3. Indicators Brief */}
        <div className="mb-4">
          <h3 className="text-[12pt] font-bold border-b border-black pb-0.5 mb-2 text-black">
            {lang === 'TH' ? '๓. การเชื่อมโยงมาตรฐานการศึกษาและตัวชี้วัด' : '3. Educational Standards & Indicators Mapping'}
          </h3>
          <div className="pl-4 space-y-1">
            {entry.selectedStandards.map(sid => {
              const std = STANDARDS.find(s => s.id === sid);
              return (
                <p key={sid} className="text-[11pt] text-black flex items-start">
                  <span className="mr-2">•</span>
                  <span>{lang === 'TH' ? std?.label : std?.labelEn}</span>
                </p>
              );
            })}
          </div>
        </div>

        {/* 4. Image (Appendix) */}
        <div className="flex-grow flex flex-col justify-start items-center mt-4">
          <h3 className="text-[12pt] font-bold border-b border-black pb-0.5 mb-2 text-black w-full">
            {lang === 'TH' ? '๕. ภาคผนวก: เอกสารแนบ/เกียรติบัตร' : '5. Appendix: Supporting Documents/Certificates'}
          </h3>
          <div className="flex items-center justify-center border border-dashed border-gray-300 p-2 bg-gray-50 rounded w-full h-auto max-h-[110mm]">
            <img 
              src={entry.imageData} 
              alt="Certificate Reference" 
              className="max-h-[105mm] w-auto max-w-full object-contain shadow-sm" 
            />
          </div>
        </div>

      </div>
    </>
  );
};

export default ReportGenerator;
