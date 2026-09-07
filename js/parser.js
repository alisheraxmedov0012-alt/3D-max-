// Promptdan barcha parametrlarni ajratib olish (professional daraja)
export function parsePrompt(text) {
    const lower = text.toLowerCase();

    const data = {
        rooms: [],
        materials: {},
        furniture: [],
        landscape: false,
        roof: false,
        floors: 1,
        hasWindows: lower.includes('deraza'),
        hasDoors: lower.includes('eshik')
    };

    // Qavatlar soni
    const floorMatch = lower.match(/(\d+)\s*qavat/);
    if (floorMatch) data.floors = parseInt(floorMatch[1]);

    // Xona turlari
    const roomKeywords = [
        { key: 'oshxona', type: 'kitchen' },
        { key: 'yotoqxona', type: 'bedroom' },
        { key: 'bolalar xonasi', type: 'kids' },
        { key: 'hammom', type: 'bathroom' },
        { key: 'vannaxona', type: 'bathroom' },
        { key: 'garaj', type: 'garage' },
        { key: 'mehmonxona', type: 'living' },
        { key: 'koridor', type: 'corridor' }
    ];
    roomKeywords.forEach(rk => {
        if (lower.includes(rk.key)) data.rooms.push({ type: rk.type });
    });

    // Agar aniq xona turi berilmagan bo'lsa, "xonali" soniga qarab
    if (data.rooms.length === 0) {
        data.rooms.push({ type: 'living' });
        const roomCountMatch = lower.match(/(\d+)\s*xonali/);
        if (roomCountMatch) {
            const count = parseInt(roomCountMatch[1]);
            for (let i = 1; i < count; i++) data.rooms.push({ type: 'bedroom' });
        }
    }

    // Landshaft va tom
    if (lower.includes('maysa') || lower.includes('hovli') || lower.includes('daraxt')) {
        data.landscape = true;
    }
    if (lower.includes('tom')) data.roof = true;

    // Rang va materiallar
    const colorMap = {
        'oq': 0xffffff,
        'qora': 0x111111,
        'qizil': 0xff3333,
        'yashil': 0x33aa33,
        'ko\u2019k': 0x3344ff,
        'jigarrang': 0x8b4513,
        'kulrang': 0x888888,
        'sariq': 0xffff33,
        'binafsha': 0x8833aa,
        'to\u2019q sariq': 0xff8833,
        'marmar': 0xdddddd,
        'yog\u2019och': 0x8a5a2b
    };

    for (const [word, hex] of Object.entries(colorMap)) {
        if (lower.includes(word)) {
            if (lower.includes('devor')) data.materials.wall = hex;
            if (lower.includes('pol')) data.materials.floor = hex;
            if (lower.includes('tom')) data.materials.roof = hex;
        }
    }

    // Mebel va jihozlar
    const furnitureList = [
        { key: 'divan', type: 'sofa', pos: [1.5, 0.5, 1.5] },
        { key: 'sofa', type: 'sofa', pos: [1.5, 0.5, 1.5] },
        { key: 'stol', type: 'table', pos: [-1.5, 0.5, 1.5] },
        { key: 'karavot', type: 'bed', pos: [0, 0.5, 2] },
        { key: 'kravat', type: 'bed', pos: [0, 0.5, 2] },
        { key: 'shkaf', type: 'wardrobe', pos: [-2.5, 1.4, 0] },
        { key: 'gilam', type: 'rug', pos: [0, 0.1, 0] },
        { key: 'televizor', type: 'tv', pos: [0, 1.6, -2.9] },
        { key: 'tv', type: 'tv', pos: [0, 1.6, -2.9] },
        { key: 'kreslo', type: 'chair', pos: [2, 0.5, 2] },
        { key: 'kitob javoni', type: 'bookshelf', pos: [-2, 1.5, -2] },
        { key: 'muzlatgich', type: 'fridge', pos: [-2, 1.2, -2] },
        { key: 'kamin', type: 'fireplace', pos: [0, 0.3, -2.8] },
        { key: 'chiroq', type: 'lamp', pos: [0, 0.3, 0] },
        { key: 'rasm', type: 'painting', pos: [2, 1.8, -2.95] }
    ];

    furnitureList.forEach(f => {
        if (lower.includes(f.key)) data.furniture.push({ type: f.type, position: f.pos.slice() });
    });

    return data;
}
