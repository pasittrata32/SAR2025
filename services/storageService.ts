
import { CertificateEntry, AchievementType, AchievementLevel } from "../types";

const STORAGE_KEY = "sar_certificates_2025";
const CONFIG_KEY = "sar_db_config";

// URL พื้นฐานที่ผู้ใช้ระบุ
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbzPSF6QcDIxtwoiysXA8D5tMbuiBoBQkzkAd1HMnDrCmOlEvsVWN69TEzzqQW2xCNEQXw/exec";

// ดึง URL ของ Google Sheet ที่ตั้งค่าไว้ (ถ้าไม่มีให้ใช้ค่าเริ่มต้น)
const getSheetUrl = () => {
  const config = localStorage.getItem(CONFIG_KEY);
  if (config) {
    try {
      const parsed = JSON.parse(config);
      return parsed.url || DEFAULT_SHEET_URL;
    } catch (e) {
      return DEFAULT_SHEET_URL;
    }
  }
  return DEFAULT_SHEET_URL;
};

export const saveSheetUrl = (url: string) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url }));
};

// ดึงข้อมูลทั้งหมด
export const getEntries = async (): Promise<CertificateEntry[]> => {
  const sheetUrl = getSheetUrl();
  
  if (sheetUrl) {
    try {
      const response = await fetch(sheetUrl);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error("Fetch from Sheet failed, falling back to local:", e);
    }
  }

  // Fallback to LocalStorage
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

// บันทึกข้อมูลใหม่
export const saveEntry = async (entry: CertificateEntry) => {
  const sheetUrl = getSheetUrl();
  
  if (sheetUrl) {
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script POST มักต้องการ no-cors หรือรับมือกับ redirect
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'save', payload: entry })
      });
    } catch (e) {
      console.error("Save to Sheet failed:", e);
    }
  }

  // เสมอต้นเสมอปลาย เก็บลง LocalStorage ด้วยเป็น Backup
  const entries = await getEntriesLocal();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// อัปเดตข้อมูล
export const updateEntry = async (updatedEntry: CertificateEntry) => {
  const sheetUrl = getSheetUrl();
  
  if (sheetUrl) {
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update', payload: updatedEntry })
      });
    } catch (e) {
      console.error("Update to Sheet failed:", e);
    }
  }

  const entries = await getEntriesLocal();
  const index = entries.findIndex(e => e.id === updatedEntry.id);
  if (index !== -1) {
    entries[index] = updatedEntry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

// ลบข้อมูล
export const deleteEntry = async (id: string) => {
  const sheetUrl = getSheetUrl();
  
  if (sheetUrl) {
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', payload: { id } })
      });
    } catch (e) {
      console.error("Delete from Sheet failed:", e);
    }
  }

  const entries = (await getEntriesLocal()).filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// Helper สำหรับ Local Storage ดั้งเดิม
const getEntriesLocal = async (): Promise<CertificateEntry[]> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};
