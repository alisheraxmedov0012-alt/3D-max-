// Kuchaytirilgan NLP parser — matnni tahlil qilib, qurilish parametrlarini chiqaradi
// O'zbek va ingliz tillarida ishlaydi

export function parsePrompt(text) {
    const lower = text.toLowerCase().trim();
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
        roomDimensions: {}, // {living: {w, d}, ...}
        random: false,
        lighting: 'day'     // 8-bosqichdagi yangi maydon
    };

    // ============ QAVATLAR SONI ============
    const floorMatch = lower.match(/(\d+)\s*qavat/);
    if (floorMatch) data.floors = Math.max(1, parseInt(floorMatch[1]));
    if (lower.includes('two story') || lower.includes('two-storey')) data.floors = 2;
    if (lower.includes('three story') || lower.includes('three-storey')) data.floors = 3;

    // ============ XONA TURLARI ============
    const roomTypes = [
        { keys: ['yashash xonasi', 'mehmonxona', 'living room', 'living'], type: 'living' },
        { keys: ['oshxona', 'kitchen'], type: 'kitchen' },
        { keys: ['yotoqxona', 'bedroom', 'bed room', 'sleeping'], type: 'bedroom' },
        { keys: ['bolalar xonasi', 'kid room', 'children room', 'kids room', 'kids'], type: 'kids' },
        { keys: ['hammom', 'vannaxona', 'bathroom', 'toilet'], type: 'bathroom' },
        { keys: ['garaj', 'garage'], type: 'garage' },
        { keys: ['koridor', 'corridor', 'hallway', 'hall'], type: 'corridor' },
        { keys: ['ofis', 'office'], type: 'living' }
    ];

    roomTypes.forEach(rt => {
        const found = rt.keys.some(key => lower.includes(key));
        if (found) data.rooms.push({ type: rt.type });
    });

    // Agar aniq xona turi bo'lmasa, "xonali" sonini hisobga olamiz
    if (data.rooms.length === 0) {
        const roomCountMatch = lower.match(/(\d+)\s*xonali/);
        const roomCount = roomCountMatch ? parseInt(roomCountMatch[1]) : 1;
        data.rooms.push({ type: 'living' });
        for (let i = 1; i < roomCount; i++) data.rooms.push({ type: 'bedroom' });
    }

    // ============ MEBBEL VA JIHOZLAR ============
    const furnitureKeywords = [
        { keys: ['divan', 'sofa'], type: 'sofa', pos: [1.5, 0.5, 1.5] },
        { keys: ['stol', 'table'], type: 'table', pos: [-1.5, 0.5, 1.5] },
        { keys: ['karavot', 'kravat', 'bed'], type: 'bed', pos: [0, 0.5, 2] },
        { keys: ['shkaf', 'wardrobe', 'closet'], type: 'wardrobe', pos: [-2.5, 1.3, 0] },
        { keys: ['gilam', 'rug', 'carpet'], type: 'rug', pos: [0, 0.1, 0] },
        { keys: ['televizor', 'tv'], type: 'tv', pos: [0, 1.6, -2.9] },
        { keys: ['kreslo', 'chair', 'armchair'], type: 'chair', pos: [2, 0.5, 2] },
        { keys: ['kitob javoni', 'bookshelf', 'shelf'], type: 'bookshelf', pos: [-2, 1.5, -2] },
        { keys: ['muzlatgich', 'fridge', 'refrigerator'], type: 'fridge', pos: [-2, 1.2, -2] },
        { keys: ['kamin', 'fireplace'], type: 'fireplace', pos: [0, 0.3, -2.8] },
        { keys: ['chiroq', 'lamp'], type: 'lamp', pos: [0, 0.3, 0] },
        { keys: ['rasm', 'painting', 'picture'], type: 'painting', pos: [2, 1.8, -2.95] },
        { keys: ['kabinet', 'cabinet'], type: 'cabinet', pos: [1.5, 0.45, -1.5] },
        { keys: ['rakovina', 'sink'], type: 'sink', pos: [0, 0.5, -1.5] },
        { keys: ['unitaz', 'toilet', 'wc'], type: 'toilet', pos: [-1, 0.4, 1.5] },
        { keys: ['dush', 'shower'], type: 'shower', pos: [0, 0.9, -1.5] },
        { keys: ['mashina', 'car', 'auto'], type: 'car', pos: [0, 0.25, 0] }
    ];

    furnitureKeywords.forEach(fk => {
        const found = fk.keys.some(key => lower.includes(key));
        if (found) {
            const exists = data.furniture.some(f => f.type === fk.type);
            if (!exists) data.furniture.push({ type: fk.type, position: fk.pos.slice() });
        }
    });

    // ============ RANGLAR VA MATERIALLAR ============
    const colorKeywords = [
        { keys: ['oq', 'white'], hex: 0xffffff },
        { keys: ['qora', 'black'], hex: 0x111111 },
        { keys: ['qizil', 'red'], hex: 0xff3333 },
        { keys: ['yashil', 'green'], hex: 0x33aa33 },
        { keys: ["ko'k", 'ko‘k', 'blue'], hex: 0x3344ff },
        { keys: ['jigarrang', 'brown'], hex: 0x8b4513 },
        { keys: ['kulrang', 'gray', 'grey'], hex: 0x888888 },
        { keys: ['sariq', 'yellow'], hex: 0xffff33 },
        { keys: ['binafsha', 'purple', 'violet'], hex: 0x8833aa },
        { keys: ["to'q sariq", 'orange'], hex: 0xff8833 },
        { keys: ['pushti', 'pink'], hex: 0xff88cc },
        { keys: ['bej', 'beige'], hex: 0xe0c0a0 }
    ];

    colorKeywords.forEach(ck => {
        ck.keys.forEach(key => {
            const idx = lower.indexOf(key);
            if (idx !== -1) {
                const context = lower.slice(Math.max(0, idx - 20), idx + key.length + 20);
                if (/devor|wall/.test(context)) data.materials.wall = ck.hex;
                if (/pol|floor/.test(context)) data.materials.floor = ck.hex;
                if (/tom|roof/.test(context)) data.materials.roof = ck.hex;
                if (!data.materials.wall && !data.materials.floor && !data.materials.roof) {
                    data.materials.wall = ck.hex;
                }
            }
        });
    });

    const materialKeywords = [
        { keys: ["yog'och", 'wood', 'wooden'], color: 0x8a5a2b },
        { keys: ['marmar', 'marble'], color: 0xdddddd },
        { keys: ['beton', 'concrete'], color: 0x999999 },
        { keys: ['shisha', 'glass'], color: 0x88aacc },
        { keys: ['metall', 'metal'], color: 0x888888 },
        { keys: ["g'isht", 'brick'], color: 0xbb5533 },
        { keys: ['tosh', 'stone'], color: 0x999999 }
    ];

    materialKeywords.forEach(mk => {
        const found = mk.keys.some(key => lower.includes(key));
        if (found) {
            if (lower.includes('pol') || lower.includes('floor')) data.materials.floor = mk.color;
            else if (lower.includes('devor') || lower.includes('wall')) data.materials.wall = mk.color;
            else if (lower.includes('tom') || lower.includes('roof')) data.materials.roof = mk.color;
            else data.materials.floor = mk.color;
        }
    });

    // ============ USLUB (STYLE) ============
    const styles = [
        { keys: ['zamonaviy', 'modern'], style: 'modern' },
        { keys: ['klassik', 'classic'], style: 'classic' },
        { keys: ['minimalizm', 'minimalist'], style: 'minimalist' },
        { keys: ['loft'], style: 'loft' },
        { keys: ['skandinaviya', 'scandinavian'], style: 'scandinavian' },
        { keys: ['rustik', 'rustic'], style: 'rustic' }
    ];

    styles.forEach(s => {
        if (s.keys.some(key => lower.includes(key))) data.style = s.style;
    });

    // ============ DERAZA VA ESHIK ============
    data.hasWindows = /deraza|window/.test(lower);
    data.hasDoors = /eshik|door/.test(lower);

    // Deraza soni (o'zbek)
    const windowsCountMatch = lower.match(/(\d+)\s*deraza/);
    if (windowsCountMatch) data.windowsCount = parseInt(windowsCountMatch[1]);

    // Deraza soni (ingliz)
    const englishWindowsCount = lower.match(/(\d+)\s*windows/);
    if (englishWindowsCount) data.windowsCount = parseInt(englishWindowsCount[1]);

    // Eshik soni (o'zbek)
    const doorsCountMatch = lower.match(/(\d+)\s*eshik/);
    if (doorsCountMatch) data.doorsCount = parseInt(doorsCountMatch[1]);

    // Eshik soni (ingliz)
    const englishDoorsCount = lower.match(/(\d+)\s*doors/);
    if (englishDoorsCount) data.doorsCount = parseInt(englishDoorsCount[1]);

    // ============ LANDSCAFT VA TOM ============
    if (/(maysa|hovli|daraxt|tree|garden|landscape|park)/.test(lower)) {
        data.landscape = true;
    }
    if (/(tom|roof)/.test(lower)) data.roof = true;

    // ============ O'LCHAMLAR (XONA O'LCHAMLARI) ============
    // Format: "6x8", "6*8", "6×8"
    const dimensionRegex = /(\d+)\s*[x×*]\s*(\d+)/;
    const dimMatch = lower.match(dimensionRegex);
    if (dimMatch) {
        const w = parseInt(dimMatch[1]);
        const d = parseInt(dimMatch[2]);
        if (data.rooms.length > 0) {
            data.roomDimensions[data.rooms[0].type] = { w, d };
        }
    }

    // Format: "10 ga 12", "10 na 12"
    const dimMatch2 = lower.match(/(\d+)\s*(?:ga|na)\s*(\d+)/);
    if (!dimMatch && dimMatch2) {
        const w = parseInt(dimMatch2[1]);
        const d = parseInt(dimMatch2[2]);
        if (data.rooms.length > 0) {
            data.roomDimensions[data.rooms[0].type] = { w, d };
        }
    }

    // Format: "120 m2"
    const areaMatch = lower.match(/(\d+)\s*(?:m2|m²|kv\.?m|kvadrat metr)/);
    if (areaMatch) {
        const area = parseInt(areaMatch[1]);
        const side = Math.sqrt(area);
        if (data.rooms.length > 0) {
            data.roomDimensions[data.rooms[0].type] = {
                w: Math.round(side),
                d: Math.round(side)
            };
        }
    }

    // ============ YORITISH (8-bosqich) ============
    if (/(kechqurun|sunset|evening|quyosh botishi)/.test(lower)) {
        data.lighting = 'sunset';
    } else if (/(tun|night|kecha)/.test(lower)) {
        data.lighting = 'night';
    } else if (/(bulutli|cloudy|bulut)/.test(lower)) {
        data.lighting = 'cloudy';
    } else if (/(quyoshli|sunny|yorug|bright)/.test(lower)) {
        data.lighting = 'sunny';
    } else {
        data.lighting = 'day';
    }

    // ============ RANDOM REJIM ============
    if (/(tasodifiy|random|taxminiy)/.test(lower)) {
        data.random = true;
    }

    return data;
}
