export const botanicalIcons = {
 heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 calendar: 'M5 3v4M19 3v4M3 9h18M4 5h16a1 1 0 0 1 1 1v15H3V6a1 1 0 0 1 1-1ZM7 13h2m3 0h2m3 0h1M7 17h2m3 0h2',
 church: 'M12 2v5M10 4h4M3 21V11l9-5 9 5v10H3Zm6 0v-7h6v7M6 12v3m12-3v3',
 glasses: 'm4 3 5 1-1 7a3 3 0 0 1-6-1l2-7Zm11 1 5-1 2 7a3 3 0 0 1-6 1l-1-7ZM5 13l-1 8m-3 0h6m12-8 1 8m-3 0h6M3 7l5 1m8 0 5-1',
 pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 rings: 'M13 14a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm10 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM12 8 8 3l4-2 4 2-4 5Z',
 camera: 'M3 7h4l2-3h6l2 3h4v14H3V7Zm14 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
 dinner: 'M4 2v8m3-8v8M1 2v8h6M4 10v12M15 2c-5 6-4 10 0 10v10M15 2v10m6-10v20',
 music: 'M9 18V5l12-3v14M9 8l12-3M9 18a4 3 0 1 1-4-3c2 0 4 1 4 3Zm12-2a4 3 0 1 1-4-3c2 0 4 1 4 3Z',
 cake: 'M3 21v-8h18v8H3Zm2-8V8h14v5M8 8V4m4 4V2m4 6V4M3 17c3-4 3 4 6 0s3 4 6 0 3 4 6 0',
 gift: 'M3 8h18v5H3V8Zm2 5v9h14v-9M12 8v14M12 8C2 8 5-2 10 3l2 5Zm0 0c10 0 7-10 2-5l-2 5Z',
 dress: 'm8 2 4 2 4-2 1 5-3 4 6 11H4l6-11-3-4 1-5ZM9 11h6',
 suit: 'm4 3 5-2 3 4 3-4 5 2 2 18h-6V8l-4 8-4-8v13H2L4 3Zm5-2 3 15 3-15M12 5v6',
 image: 'M3 3h18v18H3V3Zm0 14 6-6 4 4 3-3 5 5M9 7h.01',
 arrow: 'M4 12h16m-6-6 6 6-6 6',
 chevron: 'm5 9 7 7 7-7',
 check: 'M22 12a10 10 0 1 1-5-9M7 11l5 5L22 4',
 whatsapp: 'M21 11.5a9 9 0 0 1-13 8L2 22l2.5-6A9 9 0 1 1 21 11.5ZM8 7c-2 4 3 9 7 8l2-2-3-2-1 1-2-2 1-1-2-3-2 1Z'
} as const;
export type BotanicalIcon = keyof typeof botanicalIcons;
