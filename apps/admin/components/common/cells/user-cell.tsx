import { UserAvatar } from "./user-avatar"

interface UserCellProps {
  name: string | null
  email?: string | null
  avatarUrl?: string | null
  /** Main line instead of the name, e.g. "You"; the name moves below. */
  highlight?: string
  /** Shown when the name is unknown. */
  fallbackName: string
}

export const UserCell = ({
  name,
  email,
  avatarUrl,
  highlight,
  fallbackName,
}: UserCellProps) => {
  const displayName = name ?? fallbackName
  const primary = highlight ?? displayName
  const secondary = highlight ? displayName : email

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar name={name} src={avatarUrl} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={primary}>
          {primary}
        </p>
        {secondary && (
          <p
            className="truncate text-xs text-muted-foreground"
            title={secondary}
          >
            {secondary}
          </p>
        )}
      </div>
    </div>
  )
}
