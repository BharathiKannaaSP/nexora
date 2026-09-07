import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { useMobile } from "@workspace/ui/hooks/use-mobile"

type StepperOrientation = "horizontal" | "vertical"

interface StepperContextValue {
  value?: number
  orientation: StepperOrientation
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

interface StepperItemContextValue {
  value: number
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
  value?: number
  orientation?: StepperOrientation
}

function Stepper({
  value,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const isMobile = useMobile()

  const resolvedOrientation = isMobile ? "horizontal" : orientation
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
  value: number
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
            : "flex flex-col min-h-28",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  )
}

type StepperTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

function StepperTrigger({
  className,
  children,
  ...props
}: StepperTriggerProps) {
  const { orientation } = useStepper()

  return (
    <button
      type="button"
      data-slot="stepper-trigger"
      className={cn(
        "relative z-10  flex text-left outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        orientation === "horizontal"
          ? "flex-col items-center text-center"
          : "w-full items-start gap-3",
        className
      )}
      {...props}
    >
      {children}
    </button>
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
      className={cn("text-xs leading-5 text-muted-foreground hidden md:block", className)}
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
          ? "top-4 right-[calc(-50%+1rem)] left-[calc(50%+1rem)] h-px"
          : "top-8 bottom-0 left-4 w-px",
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
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperConnector,
}

export type { StepperOrientation }
