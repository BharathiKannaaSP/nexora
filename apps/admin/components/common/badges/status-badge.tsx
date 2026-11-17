import type { Tone } from "../tones"
import { ToneBadge } from "./tone-badge"

export type StatusConfig<S extends string> = Record<S, { tone: Tone }>

interface StatusBadgeProps<S extends string> {
  status: S
  config: StatusConfig<S>
  label: string
}

/** Any enum-like value as a badge: the config gives the tone, the caller the text. */
export function StatusBadge<S extends string>({
  status,
  config,
  label,
}: StatusBadgeProps<S>) {
  return <ToneBadge tone={config[status].tone}>{label}</ToneBadge>
}
