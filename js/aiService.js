// js/aiService.js

const SYSTEM_INSTRUCTION = `
Siz professional 3D ArchViz va arxitektura bo'yicha mutaxassis AI siz.
Foydalanuvchi matnli prompt kiritadi. Siz javobda FAQAT va FAQAT to'g'ri shakllantirilgan JSON formatidagi 3D xonalar va mebellar sxemasini qaytarishingiz kerak. Hech qanday ortiqcha matn yoki izoh yozmang.

JSON Tuzilishi:
- floors (number): Qavatlar soni
- materials (object): wall, floor, roof (hex rang kodi, masalan "0xffffff")
- rooms (array): Har bir xona uchun id, type, position {x,y,z}, size {width, height, depth}, furniture (array)
- furniture (array): type, position [x,y,z], rotation [x,y,z]
- landscape (boolean), roof (boolean)
`;

// API kalitni brauzer xotirasidan olish yoki so'rash
function getApiKey() {
    let key = localStorage.getItem("OPENROUTER_API_KEY");
    if (!key) {
        key = prompt("OpenRouter API kalitingizni kiriting:");
        if (key) {
            localStorage.setItem("OPENROUTER_API_KEY", key.trim());
        }
    }
    return key;
}

export async function generateHouseJSONFromAI(userPrompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("API kalit kiritilmadi!");
        return null;
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "3D ArchViz Generator"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: `Foydalanuvchi talabi: "${userPrompt}"` }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 401) {
                localStorage.removeItem("OPENROUTER_API_KEY"); // Noto'g'ri kalit bo'lsa o'chirish
            }
            throw new Error(errData.error?.message || `Server xatosi: ${response.status}`);
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;

        if (!rawContent) throw new Error("AI javob qaytarmadi.");

        const cleanJson = rawContent.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Generatsiya xatosi:", error.message || error);
        alert("Xatolik: " + (error.message || "Ulanish imkonsiz"));
        throw error;
    }
}
