export const brand = {
  name: "Linguamate AI",
  tagline: "Master languages with an AI that adapts to you",
  palette: {
    bg: "#0a0a0a",
    bgSecondary: "#141414",
    fg: "#fafafa",
    fgSecondary: "#a3a3a3",
    primary: {
      from: "#fbbf24",
      to: "#ea580c",
      gradient: "linear-gradient(135deg, #fbbf24 0%, #ea580c 100%)"
    },
    accent: {
      from: "#22d3ee",
      to: "#0ea5e9",
      gradient: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)"
    },
    glass: {
      bg: "rgba(255, 255, 255, 0.06)",
      border: "rgba(255, 255, 255, 0.1)",
      backdropBlur: "24px"
    }
  },
  font: {
    heading: "Inter, system-ui, -apple-system, sans-serif",
    body: "Inter, system-ui, -apple-system, sans-serif"
  },
  social: {
    x: "https://x.com/linguamateai",
    github: "https://github.com/ayais12210-hub/rork-linguamate-ai-language-tutor",
    discord: "https://discord.gg/linguamate"
  },
  links: {
    app: "/(tabs)/chat",
    download: "#download",
    demo: "#demo",
    pricing: "#pricing"
  }
} as const;

export type Brand = typeof brand;
