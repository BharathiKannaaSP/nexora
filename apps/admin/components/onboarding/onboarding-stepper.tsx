"use client"

import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import type { OnboardingStep } from "@nexora/shared/types/onboarding"
import {
  Stepper,
  StepperConnector,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperStep,
  StepperTitle,
} from "@nexora/ui/components/stepper"
import { useTranslations } from "next-intl"

const steps = [
  { value: 1, key: "basicInformation" },
  { value: 2, key: "choosePath" },
  { value: 3, key: "roleRequirements" },
  { value: 4, key: "review" },
] as const

/**
 * Stepper value for each onboarding step; REJECTED and COMPLETED stay on the
 * last one, since review shows the outcome.
 */
const stepValues: Record<OnboardingStep, number> = {
  BASIC_INFORMATION: 1,
  CHOOSE_PATH: 2,
  ROLE_REQUIREMENTS: 3,
  REVIEW: 4,
  COMPLETED: 4,
}

const OnboardingStepper = () => {
  const t = useTranslations("onboarding.steps")
  const { onboarding } = useBootstrap()
  const currentStep = onboarding ? stepValues[onboarding.currentStep] : 1

  return (
    <div className="w-full">
      <Stepper
        className="mt-2"
        orientation="vertical"
        value={currentStep}
        role="list"
      >
        {steps.map((step, index) => (
          <StepperItem key={step.value} value={step.value} role="listitem">
            <StepperStep>
              <StepperIndicator aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <StepperTitle>{t(`${step.key}.title`)}</StepperTitle>
                <StepperDescription>
                  {t(`${step.key}.description`)}
                </StepperDescription>
              </div>
            </StepperStep>
            {index < steps.length - 1 && <StepperConnector />}
          </StepperItem>
        ))}
      </Stepper>
    </div>
  )
}

export default OnboardingStepper
