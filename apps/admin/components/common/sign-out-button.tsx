"use client"

import { LogOut } from "lucide-react"

import { Button } from "@nexora/ui/components/button"

import { useSignOut } from "@/hooks/use-sign-out"

export const SignOutButton = ({ label }: { label?: string }) => {
  const { signOut, isPending } = useSignOut()

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={signOut}
      disabled={isPending}
      aria-label={label}
    >
      <LogOut aria-hidden="true" />
      <span className="hidden lg:block">{label}</span>
    </Button>
  )
}
