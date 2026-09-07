"use client"

import {
  Stepper,
  StepperConnector,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from "@workspace/ui/components/stepper"

const steps = [
  {
    value: 1,
    title: "Basic Information",
    description: "Tell us about yourself",
  },
  {
    value: 2,
    title: "Choose Your Path",
    description: "Select how you want to continue",
  },
  {
    value: 3,
    title: "Role Requirements",
    description: "Provide role specific details",
  },
  {
    value: 4,
    title: "Review & Submit",
    description: "Review your details and submit",
  },
]

const OnboardingStepper = () => {
  return (
    <Stepper className="mt-2" orientation="vertical" value={1}>
      {steps.map((step, index) => (
        <StepperItem key={step.value} value={step.value}>
          <StepperTrigger>
            <StepperIndicator />

            <div className="flex flex-col gap-1">
              <StepperTitle>{step.title}</StepperTitle>
              <StepperDescription>{step.description}</StepperDescription>
            </div>
          </StepperTrigger>

          {index < steps.length - 1 && <StepperConnector />}
        </StepperItem>
      ))}
    </Stepper>
  )
}

export default OnboardingStepper
