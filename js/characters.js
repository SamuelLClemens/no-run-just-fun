// The four coach presets. Diverse, friendly, low-poly-ready colors.

export const CHARACTERS = [
  { id: 'maya',  name: 'Maya',  skin: '#9C6644', hair: '#2A1B12', hairStyle: 'curls',
    top: '#4FA3A5', bottom: '#33424F', blurb: 'Calm hands, strong roots.' },
  { id: 'vera',  name: 'Vera',  skin: '#D9A77E', hair: '#5A3825', hairStyle: 'loose',
    top: '#C77B5A', bottom: '#4A5448', blurb: 'Breathe easy — you got this.' },
  { id: 'amara', name: 'Amara', skin: '#5C3A28', hair: '#161616', hairStyle: 'bun',
    top: '#FFD45C', bottom: '#2E4057', blurb: 'Grace with a grin.' },
  { id: 'sol',   name: 'Sol',   skin: '#C68B59', hair: '#1E1A17', hairStyle: 'ponytail',
    top: '#7EC4E8', bottom: '#41506B', blurb: 'Steady as morning light.' },
];

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
