
# 📘 คู่มือการเชื่อมต่อฐานข้อมูล Google Sheets (SAR System 2025)

คู่มือนี้จะช่วยให้คุณเปลี่ยนจากการเก็บข้อมูลในคอมพิวเตอร์เครื่องเดียว (Local Storage) เป็นการเก็บข้อมูลออนไลน์ผ่าน Google Sheets เพื่อให้ Admin หลายคนสามารถเข้าถึงข้อมูลพร้อมกันได้

---

## 🚀 ขั้นตอนการดำเนินการ

### 1. เตรียม Google Sheet
1. ไปที่ [Google Sheets](https://sheets.google.com) และสร้างไฟล์ใหม่ (Blank Spreadsheet)
2. ตั้งชื่อไฟล์ เช่น **"ฐานข้อมูลเกียรติบัตร SAR 2568"**
3. ที่แถบด้านบน เลือกเมนู **Extensions (ส่วนขยาย)** > **Apps Script**

### 2. วางรหัสโปรแกรม (Copy & Paste Code)
1. ลบโค้ดเก่าในไฟล์ `Code.gs` ออกให้หมด
2. คัดลอกรหัสด้านล่างนี้ไปวางแทนที่:

```javascript
/**
 * Google Apps Script for SAR Certificate System 2025
 * โดย โรงเรียนสาธิตอุดมศึกษา
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  var headers = data.shift();
  var json = data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      // ตรวจสอบว่าคอลัมน์นั้นเป็น JSON string หรือไม่
      if (h === 'data') {
        try { obj = JSON.parse(row[i]); } catch(e) { obj = {}; }
      }
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var requestData = JSON.parse(e.postData.contents);
  var action = requestData.action; // 'save', 'update', 'delete'
  var payload = requestData.payload;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  // สร้าง Header ถ้ายังไม่มี
  if (sheet.getLastColumn() === 0) {
    sheet.appendRow(['id', 'timestamp', 'data']);
  }
  
  var dataRange = sheet.getDataRange().getValues();
  
  if (action === 'save') {
    sheet.appendRow([payload.id, new Date(), JSON.stringify(payload)]);
    return res("Success");
  } 
  
  if (action === 'update' || action === 'delete') {
    for (var i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] == payload.id) {
        if (action === 'update') {
          sheet.getRange(i + 1, 3).setValue(JSON.stringify(payload));
        } else {
          sheet.deleteRow(i + 1);
        }
        return res("Success " + action);
      }
    }
  }
  
  return res("Action Not Found");
}

function res(msg) {
  return ContentService.createTextOutput(JSON.stringify({result: msg}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. การติดตั้ง (Deployment)
1. คลิกปุ่ม **Deploy (ทำให้ใช้งานได้)** สีน้ำเงินด้านบนขวา
2. เลือก **New deployment (การทำให้ใช้งานได้ใหม่)**
3. คลิกรูปฟันเฟือง (Select type) เลือก **Web app**
4. ตั้งค่าดังนี้:
   - **Description:** SAR 2025 Database
   - **Execute as:** Me (อีเมลของคุณ)
   - **Who has access:** **Anyone (ทุกคน)** *<-- สำคัญมาก!*
5. คลิก **Deploy**
6. หากระบบขอสิทธิ์ (Authorize access) ให้กดเลือกอีเมลของคุณ -> Advanced -> Go to ... (unsafe) -> Allow
7. **คัดลอก Web App URL** ที่ได้มา (จะขึ้นต้นด้วย `https://script.google.com/...`)

### 4. เชื่อมต่อกับระบบ SAR
1. เข้าสู่ระบบ Admin ในเว็บแอปของคุณ
2. ไปที่เมนู **"ตั้งค่าฐานข้อมูล (Database Settings)"**
3. วาง URL ที่คัดลอกมาลงในช่อง และกด **"เชื่อมต่อฐานข้อมูลออนไลน์"**

---

## ⚠️ ข้อควรระวัง
- **อย่าลบแถวที่ 1 (Header)** ใน Google Sheet เพราะระบบใช้ในการระบุคอลัมน์
- หากมีการแก้ไขโค้ดใน Apps Script ต้องทำการ **Deploy > New Deployment** ใหม่ทุกครั้งเพื่อให้ผลการแก้ไขมีผลใช้งาน
- ไฟล์เกียรติบัตร (Image) จะถูกเก็บในรูปแบบข้อความ (Base64) ในคอลัมน์ `data` โดยตรง

---
*จัดทำโดย: งานประกันคุณภาพการศึกษา โรงเรียนสาธิตอุดมศึกษา*
