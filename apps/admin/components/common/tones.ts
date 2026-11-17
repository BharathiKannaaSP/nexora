export const TONES = [
  "neutral",
  "brand",
  "info",
  "success",
  "warning",
  "danger",
] as const

export type Tone = (typeof TONES)[number]

export const toneClasses: Record<Tone, { tile: string; badge: string }> = {
  neutral: {
    tile: "bg-muted text-muted-foreground",
    badge: "bg-muted text-muted-foreground",
  },
  brand: {
    tile: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary",
  },
  info: {
    tile: "bg-info/10 text-info",
    badge: "bg-info/10 text-info",
  },
  success: {
    tile: "bg-success/10 text-success",
    badge: "bg-success/10 text-success",
  },
  warning: {
    tile: "bg-warning/10 text-warning",
    badge: "bg-warning/10 text-warning",
  },
  danger: {
    tile: "bg-destructive/10 text-destructive",
    badge: "bg-destructive/10 text-destructive",
  },
}
