// The four coach presets. Diverse, friendly, low-poly-ready colors.

export const CHARACTERS = [
  { id: 'maya',  name: 'Maya',  skin: '#9C6644', hair: '#2A1B12', hairStyle: 'curls',
    top: '#4FA3A5', bottom: '#33424F', blurb: 'Calm hands, strong roots.' },
  { id: 'june',  name: 'June',  skin: '#F2C9A8', hair: '#A14E2A', hairStyle: 'bob',
    top: '#F58F7C', bottom: '#3D6B4C', blurb: 'Sunshine in human form.' },
  { id: 'amara', name: 'Amara', skin: '#5C3A28', hair: '#161616', hairStyle: 'bun',
    top: '#FFD45C', bottom: '#2E4057', blurb: 'Grace with a grin.' },
  { id: 'sol',   name: 'Sol',   skin: '#C68B59', hair: '#1E1A17', hairStyle: 'ponytail',
    top: '#7EC4E8', bottom: '#41506B', blurb: 'Steady as morning light.' },
];

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
