"use client"

import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Ref,
} from "react"

import type { OrganizationDirectoryEntry } from "@nexora/shared/types/organization"
import { Button } from "@nexora/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@nexora/ui/components/input-group"
import { RadioGroup, RadioGroupItem } from "@nexora/ui/components/radio-group"
import { Spinner } from "@nexora/ui/components/spinner"
import { cn } from "@nexora/ui/lib/utils"

import { countryFlag, OrganizationAvatar } from "./organization-avatar"

interface OrganizationPickerProps {
  /** The cards to pick from, in order. */
  organizations: OrganizationDirectoryEntry[]
  /** The picked organization's id. */
  value: string | undefined
  onValueChange: (organization: OrganizationDirectoryEntry) => void
  /** What's typed in the search box; the caller runs the search. */
  search: string
  onSearchChange: (search: string) => void
  /** Shows a spinner in the search box while results load. */
  searching?: boolean
  /** e.g. "IN" → "India", in the page's language. */
  countryName: (countryCode: string) => string
  /** e.g. "ECOMMERCE" → "E-commerce". */
  industryName: (industry: string) => string
  /** On the search box, so the form can focus the picker. */
  inputRef?: Ref<HTMLInputElement>
  onBlur?: () => void
  /** Names the cards as a group. */
  labelId?: string
  describedBy?: string
  invalid?: boolean
}

/**
 * A search box over a row of organization cards to pick one from. The row
 * scrolls sideways; arrows page through it when it overflows.
 */
export const OrganizationPicker = ({
  organizations,
  value,
  onValueChange,
  search,
  onSearchChange,
  searching,
  countryName,
  industryName,
  inputRef,
  onBlur,
  labelId,
  describedBy,
  invalid,
}: OrganizationPickerProps) => {
  const t = useTranslations("common.organizationPicker")
  const tCommon = useTranslations("common")
  const idPrefix = useId()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState({ back: false, forward: false })

  // scrollLeft runs negative in right-to-left pages, so its size is used.
  const updateCanScroll = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const offset = Math.abs(scroller.scrollLeft)
    setCanScroll({
      back: offset > 1,
      forward: offset + scroller.clientWidth < scroller.scrollWidth - 1,
    })
  }, [])

  // Re-checked whenever the box or the row of cards changes size; the row
  // only exists while there are cards.
  const hasOrganizations = organizations.length > 0
  useEffect(() => {
    if (!hasOrganizations) return
    const observer = new ResizeObserver(updateCanScroll)
    if (scrollerRef.current) observer.observe(scrollerRef.current)
    if (rowRef.current) observer.observe(rowRef.current)
    return () => observer.disconnect()
  }, [hasOrganizations, updateCanScroll])

  const scrollBy = (direction: 1 | -1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const rtl = getComputedStyle(scroller).direction === "rtl"
    scroller.scrollBy({
      left: direction * (rtl ? -1 : 1) * scroller.clientWidth * 0.8,
      behavior: "smooth",
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onBlur={onBlur}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          autoComplete="off"
        />
        <InputGroupAddon align="inline-end">
          {searching ? (
            <Spinner aria-label={tCommon("loading")} />
          ) : (
            <Search aria-hidden="true" />
          )}
        </InputGroupAddon>
      </InputGroup>

      {!hasOrganizations ? (
        <p
          role="status"
          className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          {search.trim()
            ? t("noResults", { search: search.trim() })
            : t("empty")}
        </p>
      ) : (
        <div className="relative">
          <div
            ref={scrollerRef}
            onScroll={updateCanScroll}
            className="snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2"
          >
            <RadioGroup
              ref={rowRef}
              value={value ?? ""}
              onValueChange={(id) => {
                const organization = organizations.find(
                  (entry) => entry.id === id
                )
                if (organization) onValueChange(organization)
              }}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className="flex w-max gap-3"
            >
              {organizations.map((organization) => {
                const id = `${idPrefix}-${organization.id}`
                return (
                  <label
                    key={organization.id}
                    htmlFor={id}
                    className={cn(
                      "relative flex w-44 shrink-0 cursor-pointer snap-start flex-col gap-1 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50",
                      "has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:ring-1 has-data-checked:ring-primary",
                      "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      invalid && "border-destructive"
                    )}
                  >
                    <RadioGroupItem
                      id={id}
                      value={organization.id}
                      className="absolute inset-e-3 top-3"
                    />
                    <OrganizationAvatar
                      organization={organization}
                      className="mb-2"
                    />
                    <span className="truncate font-semibold">
                      {organization.name}
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                      <span aria-hidden="true">
                        {countryFlag(organization.countryCode)}
                      </span>
                      {countryName(organization.countryCode)}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {industryName(organization.industry)}
                    </span>
                    <span className="text-muted-foreground">
                      {t("members", { count: organization.memberCount })}
                    </span>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          {canScroll.back && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="absolute inset-s-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm rtl:translate-x-1/2"
              onClick={() => scrollBy(-1)}
              aria-label={t("scrollBack")}
            >
              <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
            </Button>
          )}
          {canScroll.forward && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="absolute inset-e-0 top-1/2 translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm rtl:-translate-x-1/2"
              onClick={() => scrollBy(1)}
              aria-label={t("scrollForward")}
            >
              <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
