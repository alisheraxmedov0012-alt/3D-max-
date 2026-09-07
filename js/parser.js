// Promptdan parametrlarni ajratib olish
export function parsePrompt(text) {
    const lower = text.toLowerCase();
    
    // Xonalar soni va turlari
    const roomCountMatch = lower.match(/(\d+)\s*xonali/);
    const roomCount = roomCountMatch ? parseInt(roomCountMatch[1]) : 1;

    const hasKitchen = lower.includes('oshxona');
    const hasGarage = lower.includes('garaj');
    const hasWindows = lower.includes('deraza');   // deraza so'zini tekshirish (o'zbekcha)
    const hasDoors = lower.includes('eshik');

    // Mebellar
    const furniture = [];
    if (lower.includes('divan') || lower.includes('sofa')) furniture.push({ type: 'sofa', position: [1.5, 0.5, 1.5] });
    if (lower.includes('stol')) furniture.push({ type: 'table', position: [-1.5, 0.5, 1.5] });
    if (lower.includes('karavot') || lower.includes('kravat')) furniture.push({ type: 'bed', position: [0, 0.5, 2] });
    if (lower.includes('shkaf')) furniture.push({ type: 'wardrobe', position: [-2.5, 1.4, 0] });
    if (lower.includes('gilam')) furniture.push({ type: 'rug', position: [0, 0.1, 0] });
    if (lower.includes('televizor') || lower.includes('tv')) furniture.push({ type: 'tv', position: [0, 1.6, -2.9] });

    return {
        roomCount,
        hasKitchen,
        hasGarage,
        hasWindows,
        hasDoors,
        furniture
    };
}
