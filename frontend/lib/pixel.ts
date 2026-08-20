/** Seeded 8-bit faces and icons. Same guest name always maps to the same look. */

export type PixelCell = { x: number; y: number; w: number; fill: string };

export type PixelPalette = {
  bg: string;
  skin: string;
  hair: string;
  shirt: string;
  accent: string;
  line: string;
  eye: string;
  white: string;
  mouth: string;
};

const PALETTES: PixelPalette[] = [
  { bg: "#3b2a1c", skin: "#f0c4a0", hair: "#2c1810", shirt: "#e85d04", accent: "#ffba08", line: "#160e0a", eye: "#1a100c", white: "#f4efe6", mouth: "#a85a4a" },
  { bg: "#1c2e28", skin: "#d9a06a", hair: "#141414", shirt: "#52b788", accent: "#f4efe6", line: "#0a1410", eye: "#1a100c", white: "#f4efe6", mouth: "#8a4a3a" },
  { bg: "#2c1c28", skin: "#c68642", hair: "#4a2010", shirt: "#d8576e", accent: "#ffba08", line: "#140c10", eye: "#1a100c", white: "#f4efe6", mouth: "#7a3a32" },
  { bg: "#1c2436", skin: "#f1c27d", hair: "#6b3a2a", shirt: "#4c8dff", accent: "#ffba08", line: "#0c1018", eye: "#1a100c", white: "#f4efe6", mouth: "#a85a4a" },
  { bg: "#2c2414", skin: "#8d5524", hair: "#0f0c0a", shirt: "#e85d04", accent: "#52b788", line: "#120e08", eye: "#1a100c", white: "#f4efe6", mouth: "#5c3028" },
  { bg: "#261c2e", skin: "#e0ac69", hair: "#c45c26", shirt: "#7b4cbf", accent: "#ffba08", line: "#100c14", eye: "#1a100c", white: "#f4efe6", mouth: "#8a4a3a" },
  { bg: "#1c2820", skin: "#ffdbac", hair: "#c8b48a", shirt: "#2d6a4f", accent: "#e85d04", line: "#0c1410", eye: "#1a100c", white: "#f4efe6", mouth: "#a85a4a" },
  { bg: "#321c1c", skin: "#b08d57", hair: "#2c1810", shirt: "#ffba08", accent: "#e85d04", line: "#160c0c", eye: "#1a100c", white: "#f4efe6", mouth: "#6a3830" },
];

/** 12×12. . empty  D outline  S skin  H hair  F fur  W eye  I iris  M mouth  T shirt  A accent  N nose */
const FACES: string[][] = [
  [
    "...AAAAAA...",
    "..AAAAAAAA..",
    "..AAHHHHAA..",
    "..DHSSSSHD..",
    "..DHSWISHD..",
    "..DHSSSSHD..",
    "...DSSSSD...",
    "...SSSSSS...",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "..T......T..",
    "............",
  ],
  [
    "..HHHHHHHH..",
    ".HHHHHHHHHH.",
    ".HHSSSSSSHH.",
    ".HSSSSSSSSH.",
    ".HSAAAAAASH.",
    ".HSWI.IWSSH.",
    ".HSSSSSSSSH.",
    "..SSSMMSSS..",
    "...SSSSSS...",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "............",
  ],
  [
    "...HHHHHH...",
    "..HHHHHHHH..",
    ".HHHSSSSHHH.",
    ".HHSSSSSSHH.",
    ".HHSWIWISSH.",
    ".HHSSSSSSHH.",
    ".HHHSSSSHHH.",
    ".HHHHSSHHHH.",
    "..HHTTTTTH..",
    "...TT.TT....",
    "............",
    "............",
  ],
  [
    "....HHHH....",
    "...HHHHHH...",
    "..HHSSSSHH..",
    "..HSSSSSSH..",
    "..HSWI.IWSH.",
    "..HSSSSSSH..",
    "...HSSSSH...",
    "...HHHHHH...",
    "....HHHH....",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "............",
  ],
  [
    "...FFFFFF...",
    "..FFFFFFFF..",
    ".FFFFFFFFFF.",
    ".FFSSSSSSFF.",
    ".FSIWSSWISF.",
    ".FFSSNNSSFF.",
    ".FFFSMMSFF..",
    "..FFFFFFFF..",
    "...FFFFFF...",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "............",
  ],
  [
    ".....HH.....",
    "....HHHH....",
    "...HHHHHH...",
    "..HHSSSSHH..",
    "..HSSSSSSH..",
    "..HSWI.IWSH.",
    "..HSSSSSSH..",
    "...SSSSSS...",
    "...SSMMSS...",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "............",
  ],
  [
    "...AAAAAAA..",
    "..AAAAAAAAA.",
    "..AAHHHHHAA.",
    "..DHSSSSHD..",
    "..DHSWISHD..",
    "..DHSSSSHD..",
    "...DSSSSD...",
    "...SSSSSS...",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "..T......T..",
    "............",
  ],
  [
    ".HH......HH.",
    ".HHH....HHH.",
    "..HHHHHHHH..",
    "..HHSSSSHH..",
    "..HSSSSSSH..",
    "..HSWI.IWSH.",
    "..HSSNSSSH..",
    "...SSMMSS...",
    "...SSSSSS...",
    "...TTTTTT...",
    "..TT.TT.TT..",
    "............",
  ],
];

export type ItemIconKind =
  | "fire"
  | "ice"
  | "bottle"
  | "food"
  | "speaker"
  | "coin"
  | "bag"
  | "people"
  | "clock"
  | "pin";

export const ICONS: Record<ItemIconKind, string[]> = {
  fire: [
    ".....AA.....",
    "....AATA....",
    "...AATTTA...",
    "...ATTTTA...",
    "..AATTTTAA..",
    "..AATTTTAA..",
    "...ATTTTA...",
    "...AATTTA...",
    "....AAAA....",
    "............",
    "............",
    "............",
  ],
  ice: [
    "............",
    "...WW..WW...",
    "..WWWWWWWW..",
    "..WWIWWIWW..",
    "...WWWWWW...",
    "....WWWW....",
    "...WWWWWW...",
    "..WW.WW.WW..",
    "............",
    "............",
    "............",
    "............",
  ],
  bottle: [
    ".....DD.....",
    ".....TT.....",
    "....TTTT....",
    "....TWWT....",
    "....TWWT....",
    "....TWWT....",
    "....TTTT....",
    "....TTTT....",
    "....TTTT....",
    ".....DD.....",
    "............",
    "............",
  ],
  food: [
    "............",
    "....AAAA....",
    "...ATTTTA...",
    "..ATSSSSSTA.",
    "..ATSSSSSTA.",
    "..ATTTTTTTA.",
    "...ATTTTTA..",
    "....DDDD....",
    "............",
    "............",
    "............",
    "............",
  ],
  speaker: [
    "......TT....",
    ".....TTT....",
    "....TWWTT...",
    "...TWIWTT...",
    "...TWIWTT...",
    "....TWWTT...",
    ".....TTT....",
    "......TT....",
    "............",
    "............",
    "............",
    "............",
  ],
  coin: [
    "............",
    "....AAAA....",
    "...AAAAAA...",
    "..AAWWWWAA..",
    "..AAWAAWAA..",
    "..AAWAAWAA..",
    "..AAWWWWAA..",
    "...AAAAAA...",
    "....AAAA....",
    "............",
    "............",
    "............",
  ],
  bag: [
    "............",
    ".....TT.....",
    "....T..T....",
    "...TTTTTT...",
    "...TSSSST...",
    "...TSSSST...",
    "...TSSSST...",
    "...TTTTTT...",
    "............",
    "............",
    "............",
    "............",
  ],
  clock: [
    "............",
    "....DDDD....",
    "...DWWWWD...",
    "..DW.I.WD...",
    "..DW.IIDD...",
    "..DWW.WWD...",
    "...DWWWWD...",
    "....DDDD....",
    "............",
    "............",
    "............",
    "............",
  ],
  pin: [
    "............",
    "....TTTT....",
    "...TWWWWT...",
    "...TWIWWT...",
    "...TWWWWT...",
    "....TTTT....",
    ".....TT.....",
    ".....TT.....",
    "......T.....",
    "............",
    "............",
    "............",
  ],
  people: [
    "............",
    "....HH.HH...",
    "...HSSHSS...",
    "...HSSHSS...",
    "....SS.SS...",
    "...TT..TT...",
    "...TT..TT...",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

export const MARK = [
  ".....AA.....",
  "....AATA....",
  "...AATTTA...",
  "..AA.TT.AA..",
  "..A..TT..A..",
  ".....TT.....",
  "....TTTT....",
  "...TTTTTT...",
  "..TTTTTTTT..",
  "...DDDDDD...",
  "............",
  "............",
];

export const MARK_COLORS: Record<string, string> = {
  A: "#e85d04",
  T: "#ffba08",
  D: "#5c2e10",
};

function hash32(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function avatarFromSeed(seed: string) {
  const h = hash32(seed.trim().toLowerCase() || "?");
  return {
    palette: PALETTES[h % PALETTES.length],
    map: FACES[(h >>> 8) % FACES.length],
  };
}

export function avatarColors(palette: PixelPalette): Record<string, string> {
  return {
    D: palette.line,
    S: palette.skin,
    H: palette.hair,
    F: palette.hair,
    W: palette.white,
    I: palette.eye,
    M: palette.mouth,
    T: palette.shirt,
    A: palette.accent,
    N: palette.line,
  };
}

export function iconKindForItem(name: string): ItemIconKind {
  const n = name.toLowerCase();
  if (/carb[oó]n|parrilla|fuego|brasas|asado/.test(n)) return "fire";
  if (/hielo/.test(n)) return "ice";
  if (/pisco|vino|cerveza|trago|bebida|ron|whisky|chela|terremoto|gin|combo/.test(n)) return "bottle";
  if (/ensalada|pan|carne|chori|completo|empanada|papas|comida|tomate|palta|queso/.test(n)) return "food";
  if (/parlante|m[uú]sica|spotify|radio/.test(n)) return "speaker";
  return "bag";
}

export function iconColors(kind: ItemIconKind): Record<string, string> {
  const base = {
    D: "#160e0a",
    S: "#f0c4a0",
    H: "#2c1810",
    W: "#f4efe6",
    I: "#1a100c",
    T: "#e85d04",
    A: "#ffba08",
    F: "#c45c26",
    N: "#160e0a",
    M: "#a85a4a",
  };
  if (kind === "clock") return { ...base, D: "#c9b8a4", W: "#2a2420", I: "#ffba08" };
  if (kind === "pin") return { ...base, T: "#e85d04", W: "#f4efe6", I: "#1a0c04" };
  if (kind === "ice") return { ...base, W: "#b8d4e8", I: "#7aa0c4" };
  if (kind === "bottle") return { ...base, T: "#52b788", W: "#d8f3dc", D: "#1b4332" };
  if (kind === "food") return { ...base, A: "#e85d04", T: "#f4efe6", S: "#52b788" };
  if (kind === "speaker") return { ...base, T: "#c9b8a4", W: "#2a2420", I: "#ffba08" };
  if (kind === "coin") return { ...base, A: "#ffba08", W: "#ffe08a" };
  if (kind === "bag") return { ...base, T: "#c9b8a4", S: "#f4efe6" };
  return base;
}

export function cellsFromMap(map: string[], colors: Record<string, string>): PixelCell[] {
  const cells: PixelCell[] = [];
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    let x = 0;
    while (x < row.length) {
      const fill = colors[row[x]];
      if (!fill) {
        x += 1;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === row[x]) w += 1;
      cells.push({ x, y, w, fill });
      x += w;
    }
  }
  return cells;
}

export function assertPixelMaps() {
  for (const face of FACES) {
    if (face.length !== 12 || face.some((row) => row.length !== 12)) {
      throw new Error("avatar sprite must be 12x12");
    }
  }
  for (const [kind, rows] of Object.entries(ICONS)) {
    if (rows.length !== 12 || rows.some((row) => row.length !== 12)) {
      throw new Error(`icon ${kind} must be 12x12`);
    }
  }
  if (MARK.length !== 12 || MARK.some((row) => row.length !== 12)) {
    throw new Error("mark must be 12x12");
  }
}
