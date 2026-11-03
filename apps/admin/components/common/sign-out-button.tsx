"use client"

import { Button } from "@nexora/ui/components/button"
import { LogOut } from "lucide-react"
import { useParams } from "next/navigation"
import { useTransition } from "react"
import { logout } from "@/lib/api/auth/logout"
import { useTranslations } from "next-intl"

export const SignOutButton = ({ label }: { label?: string }) => {
  const { country, lang } = useParams<{ country: string; lang: string }>()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("dashboard")

  const handleSignOut = () =>
    startTransition(async () => {
      await logout(country, lang)
    })

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleSignOut}
      disabled={isPending}
      aria-label={label}
    >
      <LogOut aria-hidden="true" />
      <span className="hidden lg:block">{label}</span>
    </Button>
  )
}
