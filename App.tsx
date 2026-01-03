
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TeacherForm from './components/TeacherForm';
import AdminDashboard from './components/AdminDashboard';
import { Role, Language } from './types';
import { SCHOOL_NAME, TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [role, setRole] = useState<Role>(Role.TEACHER);
  const [lang, setLang] = useState<Language>('TH');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const t = TRANSLATIONS[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // อัปเดตรหัสผ่านตามที่ผู้ใช้ระบุ: admin / 0833759527
    if (username === 'admin' && password === '0833759527') {
      setIsLoggedIn(true);
      setRole(Role.ADMIN);
    } else {
      alert(lang === 'TH' ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : 'Invalid username or password');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole(Role.TEACHER);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header lang={lang} />
      
      <main className="flex-grow">
        {/* Navigation / Role Switcher - No print */}
        <div className="no-print container mx-auto px-4 mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex bg-white rounded-lg shadow-sm border p-1">
            <button 
              onClick={() => { logout(); setRole(Role.TEACHER); }}
              className={`px-4 py-1 rounded-md text-sm transition ${role === Role.TEACHER ? 'bg-[#002147] text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t.teacherRole}
            </button>
            <button 
              onClick={() => setRole(Role.ADMIN)}
              className={`px-4 py-1 rounded-md text-sm transition ${role === Role.ADMIN ? 'bg-[#002147] text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t.adminRole}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex bg-slate-200 rounded-lg p-1">
              <button 
                onClick={() => setLang('TH')}
                className={`px-3 py-1 rounded text-xs font-bold transition ${lang === 'TH' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                TH
              </button>
              <button 
                onClick={() => setLang('EN')}
                className={`px-3 py-1 rounded text-xs font-bold transition ${lang === 'EN' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                EN
              </button>
            </div>

            {isLoggedIn && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">{t.welcome}: Admin QA</span>
                <button onClick={logout} className="text-xs text-red-600 hover:underline">{t.logout}</button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {role === Role.TEACHER ? (
          <TeacherForm lang={lang} />
        ) : (
          <>
            {isLoggedIn ? (
              <AdminDashboard lang={lang} />
            ) : (
              <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-xl shadow-xl border">
                <h2 className="text-2xl font-bold text-[#002147] mb-6 text-center">{t.adminLogin}</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.username}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-[#002147]" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.password}</label>
                    <input 
                      type="password" 
                      className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-[#002147]" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button className="w-full py-2 bg-[#002147] text-white rounded-lg font-bold hover:bg-blue-900 transition mt-4 shadow-lg">
                    {t.login}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="no-print bg-slate-100 py-6 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2025 {SCHOOL_NAME} - {lang === 'TH' ? 'ระบบประกันคุณภาพการศึกษา' : 'Quality Assurance System'} (SAR)</p>
          <p className="text-slate-400 text-[10px] mt-1">Design for Academic Excellence | Powered by Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
