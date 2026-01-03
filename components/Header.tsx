
import React from 'react';
import { SCHOOL_NAME, SCHOOL_ADDRESS, ACADEMIC_YEAR, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface HeaderProps {
  lang: Language;
}

const Header: React.FC<HeaderProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  return (
    <header className="bg-[#002147] text-white py-6 shadow-lg no-print">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold">{SCHOOL_NAME}</h1>
          <p className="text-sm opacity-80">{SCHOOL_ADDRESS}</p>
          <div className="mt-2 inline-block bg-white text-[#002147] px-3 py-1 rounded-full text-sm font-semibold">
            {t.systemTitle} {t.academicYearLabel} {ACADEMIC_YEAR}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
