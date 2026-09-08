// O'zbek va Ingliz tillari uchun kuchaytirilgan va gibrid NLP Parser

/**
 * Matndagi tutroq va maxsus belgilarni bir xil ko'rinishga keltirish
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[`‘’]/g, "'")
        .trim();
}

/**
 * Aniq qoidalar (Rule-Based RegEx) asosida tezkor parser
 */
export function parsePrompt(text) {
    const lower = normalizeText(text);
    
    const data = {
        rooms: [],
        furniture: [],
        materials: {},
        style: null,
        landscape: false,
        roof: false,
        floors: 1,
        hasWindows: false,
        hasDoors: false,
        windowsCount: 0,
        doorsCount: 0,
        roomDimensions: {},
        random: false,
        lighting: 'day'
    };

    // ============ 1. QAVATLAR SONI ============
    const floorMatch = lower.match(/(\d+)\s*(?:qavat|story|storey|этаж)/);
    if (floorMatch) {
        data.floors = Math.max(1, parseInt(floorMatch[1], 10));
    } else if (lower.includes('bir qavat') || lower.includes('one story')) data.floors = 1;
    else if (lower.includes('ikki qavat') || lower.includes('two story')) data.floors = 2;
    else if (lower.includes('uch qavat') || lower.includes('three story')) data.floors = 3;

    // ============ 2. XONA TURLARI VA O'LCHAMLARI ============
    const roomTypes = [
        { keys: ['yashash xonasi', 'mehmonxona', 'living room', 'living', 'gostinaya'], type: 'living' },
        { keys: ['oshxona', 'kitchen'], type: 'kitchen' },
        { keys: ['yotoqxona', 'bedroom', 'bed room', 'sleeping'], type: 'bedroom' },
        { keys: ['bolalar xonasi', 'kid room', 'children room', 'kids'], type: 'kids' },
        { keys: ['hammom', 'vannaxona', 'bathroom', 'toilet', 'wc'], type: 'bathroom' },
        { keys: ['garaj', 'garage'], type: 'garage' },
        { keys: ['koridor', 'corridor', 'hallway', 'hall'], type: 'corridor' },
        { keys: ['ofis', 'kabinet', 'office'], type: 'office' }
    ];

    roomTypes.forEach(rt => {
        if (rt.keys.some(key => lower.includes(key))) {
            data.rooms.push({ type: rt.type });
        }
    });

    if (data.rooms.length === 0) {
        const roomCountMatch = lower.match(/(\d+)\s*xonali/);
        const roomCount = roomCountMatch ? parseInt(roomCountMatch[1], 10) : 1;
        data.rooms.push({ type: 'living' });
        for (let i = 1; i < roomCount; i++) data.rooms.push({ type: 'bedroom' });
    }

    // Xonalarga mos o'lchamlarni ajratib olish (masalan: "yashash xonasi 6x8, yotoqxona 4x4")
    const dimRegex = /(\b[a-z'ʻ‘]+(?:\s+[a-z'ʻ‘]+)?\b)?\s*(\d+)\s*[x×*]\s*(\d+)/g;
    let match;
    while ((match = dimRegex.exec(lower)) !== null) {
        const roomName = match[1] ? match[1].trim() : null;
        const w = parseInt(match[2], 10);
        const d = parseInt(match[3], 10);

        let targetRoom = data.rooms[0]?.type || 'living';
        if (roomName) {
            const matchedRt = roomTypes.find(rt => rt.keys.some(k => roomName.includes(k)));
            if (matchedRt) targetRoom = matchedRt.type;
        }
        data.roomDimensions[targetRoom] = { w, d };
    }

    // ============ 3. MEBEL VA JIHOZLAR (SONI BILAN) ============
    const furnitureKeywords = [
        { keys: ['divan', 'sofa'], type: 'sofa', basePos: [1.5, 0.5, 1.5] },
        { keys: ['stol', 'table'], type: 'table', basePos: [-1.5, 0.5, 1.5] },
        { keys: ['stul', 'kreslo', 'chair', 'armchair'], type: 'chair', basePos: [1.8, 0.5, 1.0] },
        { keys: ['karavot', 'kravat', 'bed'], type: 'bed', basePos: [0, 0.5, 2] },
        { keys: ['shkaf', 'wardrobe', 'closet'], type: 'wardrobe', basePos: [-2.5, 1.3, 0] },
        { keys: ['gilam', 'rug', 'carpet'], type: 'rug', basePos: [0, 0.01, 0] },
        { keys: ['televizor', 'tv'], type: 'tv', basePos: [0, 1.6, -2.9] },
        { keys: ['kitob javoni', 'bookshelf', 'shelf'], type: 'bookshelf', basePos: [-2, 1.5, -2] },
        { keys: ['muzlatgich', 'fridge', 'refrigerator'], type: 'fridge', basePos: [-2, 1.2, -2] },
        { keys: ['chiroq', 'lamp', 'torsher'], type: 'lamp', basePos: [0, 0.3, 0] }
    ];

    furnitureKeywords.forEach(fk => {
        fk.keys.forEach(key => {
            const pattern = new RegExp(`(?:(\\d+)\\s*(?:ta|dona|x)?\\s*)?${key}`, 'g');
            let fMatch;
            while ((fMatch = pattern.exec(lower)) !== null) {
                const count = fMatch[1] ? parseInt(fMatch[1], 10) : 1;
                for (let i = 0; i < count; i++) {
                    // Mebellar bir joyga ustma-ust tushmasligi uchun ozgina offset beramiz
                    const offset = i * 0.6;
                    const pos = [fk.basePos[0] + offset, fk.basePos[1], fk.basePos[2]];
                    data.furniture.push({ type: fk.type, position: pos });
                }
            }
        });
    });

    // ============ 4. RANGLAR VA MATERIALLAR ============
    const colorKeywords = [
        { keys: ['oq', 'white'], hex: 0xffffff },
        { keys: ['qora', 'black'], hex: 0x111111 },
        { keys: ['qizil', 'red'], hex: 0xff3333 },
        { keys: ['yashil', 'green'], hex: 0x33aa33 },
        { keys: ["ko'k", 'blue'], hex: 0x3344ff },
        { keys: ['jigarrang', 'brown'], hex: 0x8b4513 },
        { keys: ['kulrang', 'gray', 'grey'], hex: 0x888888 },
        { keys: ['sariq', 'yellow'], hex: 0xffff33 }
    ];

    colorKeywords.forEach(ck => {
        ck.keys.forEach(key => {
            const idx = lower.indexOf(key);
            if (idx !== -1) {
                const context = lower.slice(Math.max(0, idx - 15), idx + key.length + 15);
                if (/devor|wall/.test(context)) data.materials.wall = ck.hex;
                else if (/pol|floor/.test(context)) data.materials.floor = ck.hex;
                else if (/tom|roof/.test(context)) data.materials.roof = ck.hex;
                else if (!data.materials.wall) data.materials.wall = ck.hex;
            }
        });
    });

    // ============ 5. USLUB (STYLE) ============
    const styles = [
        { keys: ['zamonaviy', 'modern'], style: 'modern' },
        { keys: ['klassik', 'classic'], style: 'classic' },
        { keys: ['minimalizm', 'minimalist'], style: 'minimalist' },
        { keys: ['loft'], style: 'loft' },
        { keys: ['skandinaviya', 'scandinavian'], style: 'scandinavian' }
    ];
    styles.forEach(s => {
        if (s.keys.some(key => lower.includes(key))) data.style = s.style;
    });

    // ============ 6. DERAZA, ESHIK VA YORITISH ============
    data.hasWindows = /deraza|window/.test(lower);
    data.hasDoors = /eshik|door/.test(lower);

    const winMatch = lower.match(/(\d+)\s*(?:ta|dona)?\s*(?:deraza|window)/);
    if (winMatch) data.windowsCount = parseInt(winMatch[1], 10);

    const doorMatch = lower.match(/(\d+)\s*(?:ta|dona)?\s*(?:eshik|door)/);
    if (doorMatch) data.doorsCount = parseInt(doorMatch[1], 10);

    data.landscape = /(maysa|hovli|daraxt|tree|garden|landscape|park)/.test(lower);
    data.roof = /(tom|roof)/.test(lower);

    if (/(kechqurun|sunset|evening)/.test(lower)) data.lighting = 'sunset';
    else if (/(tun|night|kecha)/.test(lower)) data.lighting = 'night';
    else if (/(bulutli|cloudy)/.test(lower)) data.lighting = 'cloudy';
    else if (/(quyoshli|sunny|yorug)/.test(lower)) data.lighting = 'sunny';

    if (/(tasodifiy|random|taxminiy)/.test(lower)) data.random = true;

    return data;
}

/**
 * 7. Gemini API Integratsiyasi (Kolleksiya / Gibrid Rejim)
 * Murakkab va uzun so'rovlar uchun Gemini API ishlatiladi, muammo bo'lsa parsePrompt()'ga tushadi.
 */
export async function parsePromptWithAI(text, apiKey) {
    if (!apiKey) return parsePrompt(text);

    const systemPrompt = `You are a 3D architecture layout parser. Convert human user text into structured JSON matching this interface:
{
  "floors": number,
  "rooms": [{"type": "living" | "kitchen" | "bedroom" | "kids" | "bathroom" | "garage"}],
  "furniture": [{"type": string, "position": [x, y, z]}],
  "materials": {"wall": hexNumber, "floor": hexNumber, "roof": hexNumber},
  "style": string,
  "landscape": boolean,
  "roof": boolean,
  "windowsCount": number,
  "doorsCount": number,
  "lighting": "day" | "night" | "sunset" | "cloudy" | "sunny"
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Input: "${text}"` }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const resData = await response.json();
        const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(jsonText);
    } catch (err) {
        console.warn("AI parsing xatosi, regEx parserga o'tildi:", err);
        return parsePrompt(text);
    }
}
