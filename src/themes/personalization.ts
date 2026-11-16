export const palettes = {
 olive: { primary: '#596B3B', secondary: '#A5AE8B', background: '#F8F5EF', surface: '#FFFCF7', text: '#333F26', border: '#ded5c4', accent: '#C9B58A', canvas: '#eae7de' },
 rose: { primary: '#854E59', secondary: '#C4A1A4', background: '#FAF3F1', surface: '#FFFCF7', text: '#443039', border: '#D9BCC0', accent: '#B88B73', canvas: '#EBE0DF' }
} as const;
export type ThemeColors = { [Key in keyof typeof palettes.olive]: string };
export const typographyOptions = {
 romantic: { heading: "'Cormorant Garamond', Georgia, serif", body: "'Inter', Arial, sans-serif", script: "'Great Vibes', cursive" },
 classic: { heading: 'Georgia, serif', body: "'Inter', Arial, sans-serif", script: "'Great Vibes', cursive" }
} as const;
export interface ThemePersonalization {
 palette?: keyof typeof palettes;
 colors?: Partial<ThemeColors>;
 typography?: keyof typeof typographyOptions;
 ornament?: 'floral' | 'minimal';
 icons?: 'fine' | 'soft';
 variant?: 'plain' | 'outlined';
 assets?: { corner?: string; ornament?: string; background?: string };
}
function luminance(hex: string): number {
 const channels = [1,3,5].map(index => parseInt(hex.slice(index,index+2),16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
 return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
}
export function contrastRatio(a: string, b: string): number {
 const values = [luminance(a), luminance(b)].sort((x,y)=>y-x);
 return (values[0]+.05)/(values[1]+.05);
}
export function resolvePersonalization(value: ThemePersonalization = {}) {
 if (!Object.hasOwn(palettes,value.palette ?? 'olive')) throw new Error('personalization.palette: opción desconocida');
 if (!Object.hasOwn(typographyOptions,value.typography ?? 'romantic')) throw new Error('personalization.typography: opción desconocida');
 for (const [field,allowed,fallback] of [['ornament',['floral','minimal'],'floral'],['icons',['fine','soft'],'fine'],['variant',['plain','outlined'],'plain']] as const) {
  if (!(allowed as readonly string[]).includes(value[field] ?? fallback)) throw new Error(`personalization.${field}: opción desconocida`);
 }
 const colors: ThemeColors = { ...palettes[value.palette ?? 'olive'], ...value.colors };
 for (const [key,color] of Object.entries(colors)) {
  if (!Object.hasOwn(palettes.olive,key) || typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`personalization.colors.${key}: usar color hexadecimal de seis dígitos`);
 }
 for (const [a,b] of [['text','background'],['text','surface'],['primary','background'],['primary','surface'],['text','canvas']] as const) {
  if (contrastRatio(colors[a],colors[b]) < 4.5) throw new Error(`personalization.colors: contraste insuficiente entre ${a} y ${b} (mínimo 4.5:1)`);
 }
 return { colors, fonts: typographyOptions[value.typography ?? 'romantic'], ornament: value.ornament ?? 'floral', icons: value.icons ?? 'fine', variant: value.variant ?? 'plain', assets: value.assets ?? {} };
}
