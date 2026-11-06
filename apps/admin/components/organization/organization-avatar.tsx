import { Avatar, AvatarFallback } from "@nexora/ui/components/avatar"
import { cn } from "@nexora/ui/lib/utils"

// Tints an organization's initials get, picked from its id so it always
// gets the same one.
const TINTS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
  "bg-info/10 text-info",
  "bg-destructive/10 text-destructive",
]

const tintFor = (id: string) => {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return TINTS[Math.abs(hash) % TINTS.length]
}

/** "Trendslane India" → "TI"; a single word gives its first two letters. */
export const organizationInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters =
    words.length > 1
      ? words.slice(0, 2).map((word) => [...word][0])
      : [...(words[0] ?? "")].slice(0, 2)
  return letters.join("").toLocaleUpperCase()
}

/** The flag emoji of an ISO 3166-1 alpha-2 code, e.g. "IN" → 🇮🇳. */
export const countryFlag = (countryCode: string) =>
  /^[A-Z]{2}$/i.test(countryCode)
    ? String.fromCodePoint(
        ...[...countryCode.toUpperCase()].map(
          (letter) => 0x1f1e6 + letter.charCodeAt(0) - 65
        )
      )
    : ""

/** An organization's initials in a tinted circle; it has no public logo. */
export const OrganizationAvatar = ({
  organization,
  size = "lg",
  className,
}: {
  organization: { id: string; name: string }
  size?: "default" | "sm" | "lg"
  className?: string
}) => (
  <Avatar size={size} className={className} aria-hidden="true">
    <AvatarFallback className={cn("font-semibold", tintFor(organization.id))}>
      {organizationInitials(organization.name)}
    </AvatarFallback>
  </Avatar>
)
