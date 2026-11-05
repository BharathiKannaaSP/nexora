/** The stepper's steps, in order; labels live in onboarding.json under steps.*. */
export const onboardingSteps = [
  "basicInformation",
  "choosePath",
  "roleRequirements",
  "review",
] as const

export type OnboardingStep = (typeof onboardingSteps)[number]
