// js/aiService.js

const OPENAI_API_KEY = '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';

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
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
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
            console.error("OpenAI API Xatolik tafsiloti:", errData);
            throw new Error(errData.error?.message || `OpenAI API Xatosi: ${response.status}`);
        }

        const data = await response.json();

        // Javob strukturasini xavfsiz tekshirish
        const jsonContent = data.choices?.[0]?.message?.content;
        if (!jsonContent) {
            throw new Error("AI to'g'ri javob strukturasini qaytarmadi.");
        }

        return JSON.parse(jsonContent);

    } catch (error) {
        console.error("GPT-4o-mini generatsiyasida xatolik:", error.message || error);
        alert("Generatsiya xatosi: " + (error.message || "Noma'lum xatolik"));
        throw error;
    }
}
