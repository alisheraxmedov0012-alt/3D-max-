// js/aiService.js

const OPENROUTER_API_KEY = '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';

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

export async function generateHouseJSONFromAI(userPrompt) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
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
            console.error("OpenRouter API Xatolik tafsiloti:", errData);
            throw new Error(errData.error?.message || `OpenRouter API Xatosi: ${response.status}`);
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;

        if (!rawContent) {
            throw new Error("AI to'g'ri javob strukturasini qaytarmadi.");
        }

        const cleanJson = rawContent.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("GPT-4o-mini generatsiyasida xatolik:", error.message || error);
        alert("Generatsiya xatosi: " + (error.message || "Noma'lum xatolik"));
        throw error;
    }
}
