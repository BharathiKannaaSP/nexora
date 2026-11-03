import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { useMobile, useWide } from "../hooks/use-mobile"

type StepperOrientation = "horizontal" | "vertical"

interface StepperContextValue {
  value?: number | string
  orientation: StepperOrientation
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

interface StepperItemContextValue {
  value: number | string
  status: "completed" | "current" | "upcoming"
}

const StepperItemContext = React.createContext<StepperItemContextValue | null>(
  null
)

function useStepper() {
  const context = React.useContext(StepperContext)

  if (!context) {
    throw new Error("Stepper components must be used inside <Stepper />")
  }

  return context
}

function useStepperItem() {
  const context = React.useContext(StepperItemContext)

  if (!context) {
    throw new Error(
      "Stepper item components must be used inside <StepperItem />"
    )
  }

  return context
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | string
  orientation?: StepperOrientation
}

function Stepper({
  value,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const wide = useWide()

  const resolvedOrientation = !wide ? "horizontal" : orientation
  return (
    <StepperContext.Provider
      value={{ value, orientation: resolvedOrientation }}
    >
      <div
        data-slot="stepper"
        data-orientation={resolvedOrientation}
        className={cn(
          "flex w-full",
          resolvedOrientation === "horizontal"
            ? "flex-row items-start"
            : "flex-col",
          className
        )}
        {...props}
      />
    </StepperContext.Provider>
  )
}

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number | string
}

function StepperItem({
  value,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { value: currentValue, orientation } = useStepper()

  const status =
    currentValue === undefined
      ? "upcoming"
      : typeof value === "string" || typeof currentValue === "string"
        ? value === currentValue
          ? "current"
          : "upcoming"
        : value < currentValue
          ? "completed"
          : value === currentValue
            ? "current"
            : "upcoming"

  return (
    <StepperItemContext.Provider value={{ value, status }}>
      <div
        data-slot="stepper-item"
        data-state={status}
        data-orientation={orientation}
        className={cn(
          "group relative",
          orientation === "horizontal"
            ? "flex min-w-0 flex-1 flex-col items-center"
            : "flex min-h-28 flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  )
}

function stepLayoutClasses(orientation: StepperOrientation) {
  return cn(
    "relative z-10 flex rounded-md text-start outline-none",
    "focus-visible:ring-3 focus-visible:ring-ring/50",
    orientation === "horizontal"
      ? "flex-col items-center text-center"
      : "w-full items-start gap-3"
  )
}

type StepperTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

/** Clickable step, for steppers that let users jump between steps. */
function StepperTrigger({
  className,
  children,
  ...props
}: StepperTriggerProps) {
  const { orientation } = useStepper()
  const { status } = useStepperItem()

  return (
    <button
      type="button"
      data-slot="stepper-trigger"
      aria-current={status === "current" ? "step" : undefined}
      className={cn(
        stepLayoutClasses(orientation),
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Read-only step: same layout as StepperTrigger and reachable with Tab so
 * screen readers announce it, but it is not a button and does nothing on click.
 */
function StepperStep({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { orientation } = useStepper()
  const { status } = useStepperItem()

  return (
    <div
      data-slot="stepper-step"
      tabIndex={0}
      aria-current={status === "current" ? "step" : undefined}
      className={cn(stepLayoutClasses(orientation), className)}
      {...props}
    />
  )
}

type StepperIndicatorProps = React.HTMLAttributes<HTMLDivElement>

function StepperIndicator({
  className,
  children,
  ...props
}: StepperIndicatorProps) {
  const { status, value } = useStepperItem()

  return (
    <div
      data-slot="stepper-indicator"
      data-state={status}
      className={cn(
        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
        "border bg-background text-sm font-medium",
        "transition-colors",
        status === "completed" &&
          "border-primary bg-primary text-primary-foreground",
        status === "current" &&
          "border-primary bg-primary text-primary-foreground",
        status === "upcoming" && "border-border text-muted-foreground",
        className
      )}
      {...props}
    >
      {status === "completed" ? (
        <CheckIcon className="size-4" />
      ) : (
        (children ?? value)
      )}
    </div>
  )
}

function StepperTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="stepper-title"
      className={cn(
        "text-sm font-medium",
        "text-muted-foreground",
        "group-data-[state=current]:text-primary",
        "group-data-[state=completed]:text-foreground",
        "hidden md:block",
        className
      )}
      {...props}
    />
  )
}

function StepperDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="stepper-description"
      className={cn(
        "hidden text-xs leading-5 text-muted-foreground md:block",
        className
      )}
      {...props}
    />
  )
}

function StepperConnector({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { orientation } = useStepper()

  return (
    <div
      aria-hidden="true"
      data-slot="stepper-connector"
      data-orientation={orientation}
      className={cn(
        "absolute bg-border",
        orientation === "horizontal"
          ? "inset-s-[calc(50%+1rem)] inset-e-[calc(-50%+1rem)] top-4 h-px"
          : "inset-s-4 top-8 bottom-0 w-px",
        className
      )}
      {...props}
    />
  )
}

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperStep,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperConnector,
}

export type { StepperOrientation }
