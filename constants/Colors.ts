export const colors = {
  paper: "#F4EFE8",
  paperDark: "#14110F",
  ink: "#1C1917",
  inkDark: "#F5F0EA",
  muted: "#78716C",
  mutedDark: "#A8A29A",
  card: "#FFFCF8",
  cardDark: "#1C1917",
  line: "#E7E0D6",
  lineDark: "#2A2520",
  terracotta: "#C45C26",
  moss: "#3D9A6A",
  danger: "#B42318",
}

export default {
  light: {
    text: colors.ink,
    background: colors.paper,
    tint: colors.terracotta,
    tabIconDefault: "#A8A29A",
    tabIconSelected: colors.terracotta,
    card: colors.card,
    muted: colors.muted,
    line: colors.line,
  },
  dark: {
    text: colors.inkDark,
    background: colors.paperDark,
    tint: colors.terracotta,
    tabIconDefault: "#57534E",
    tabIconSelected: colors.terracotta,
    card: colors.cardDark,
    muted: colors.mutedDark,
    line: colors.lineDark,
  },
}
