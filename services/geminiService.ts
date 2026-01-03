
import { GoogleGenAI, Type } from "@google/genai";
import { CertificateEntry } from "../types";
import { STANDARDS } from "../constants";

export const generateQualitativeDescription = async (entry: Partial<CertificateEntry>) => {
  // Always obtain a fresh instance with the current API key as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const selectedStandardLabels = entry.selectedStandards?.map(id => STANDARDS.find(s => s.id === id)?.label).join(", ") || "";
  
  // Prompt focuses on the dynamic content
  const prompt = `
    Activity Details:
    - Name: ${entry.activityName}
    - Type: ${entry.type}
    - Level: ${entry.level}
    - Standards: ${selectedStandardLabels}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        // Use systemInstruction for defining the persona and overall task constraints
        systemInstruction: "Analyze the provided educational achievement and write a professional qualitative description for a school SAR (Self-Assessment Report) in both Thai and English. The description should reflect how this activity benefits learners, teaching quality, or the organization. Use a professional and formal academic tone.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            th: { type: Type.STRING, description: "Qualitative description in Thai" },
            en: { type: Type.STRING, description: "Qualitative description in English" },
          },
          required: ["th", "en"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No text returned from AI");
    }

    // response.text is a property, not a method
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      th: "ผลงานดังกล่าวสะท้อนถึงความมุ่งมั่นในการพัฒนาคุณภาพการศึกษาและการเรียนรู้ของผู้เรียนอย่างต่อเนื่อง",
      en: "This achievement demonstrates a continuous commitment to enhancing educational quality and student learning outcomes."
    };
  }
};
