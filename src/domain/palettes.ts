export type PaletteId =
  | "moss"
  | "tide"
  | "ember"
  | "orchid"
  | "ink"
  | "sunset"
  | "cedar"
  | "lagoon"
  | "slate"

export type Palette = {
  id: PaletteId
  name: string
  pro: boolean
  swatch: string
  cell: string
  empty: string
}

export const PALETTES: Record<PaletteId, Palette> = {
  moss: {
    id: "moss",
    name: "Moss",
    pro: false,
    swatch: "#5CDB95",
    cell: "#3D9A6A",
    empty: "#1C2A22",
  },
  tide: {
    id: "tide",
    name: "Tide",
    pro: false,
    swatch: "#7DD3FC",
    cell: "#3B82C4",
    empty: "#1A2730",
  },
  ember: {
    id: "ember",
    name: "Ember",
    pro: false,
    swatch: "#FB923C",
    cell: "#E06A2C",
    empty: "#2A1E16",
  },
  orchid: {
    id: "orchid",
    name: "Orchid",
    pro: false,
    swatch: "#E879F9",
    cell: "#C026D3",
    empty: "#26182A",
  },
  ink: {
    id: "ink",
    name: "Ink",
    pro: false,
    swatch: "#E7E5E4",
    cell: "#D6D3D1",
    empty: "#292524",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    pro: false,
    swatch: "#FDA4AF",
    cell: "#F43F5E",
    empty: "#2A181C",
  },
  cedar: {
    id: "cedar",
    name: "Cedar",
    pro: true,
    swatch: "#D4A574",
    cell: "#B45309",
    empty: "#2A2118",
  },
  lagoon: {
    id: "lagoon",
    name: "Lagoon",
    pro: true,
    swatch: "#5EEAD4",
    cell: "#0F766E",
    empty: "#142422",
  },
  slate: {
    id: "slate",
    name: "Slate",
    pro: true,
    swatch: "#94A3B8",
    cell: "#475569",
    empty: "#1E293B",
  },
}

export const PALETTE_LIST = Object.values(PALETTES)

export function paletteOf(id: string): Palette {
  return PALETTES[id as PaletteId] ?? PALETTES.moss
}

export const ICONS = [
  "💧",
  "📖",
  "🚶",
  "✍️",
  "🧘",
  "💪",
  "💊",
  "😴",
  "🥗",
  "☕️",
  "🧹",
  "🎯",
  "🎸",
  "🧠",
  "☀️",
  "📵",
  "🦷",
  "🍎",
]

export const PREMIUM_ICONS = ["🙏", "🌬️", "🤸", "🗂️", "🌙", "🔥", "🎧", "🪴"]
