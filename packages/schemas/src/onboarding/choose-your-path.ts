import { z } from "zod"
import {
  refineUserDetails,
  userDetailsObjectSchema,
  type UserDetailsUpdateValidationMessages,
} from "../user-details/user-details-update"

import { USER_ONBOARDING_SELECTED_PATHS } from "./update-step"

export interface ChooseYourPathValidationMessages extends UserDetailsUpdateValidationMessages {
  selectedPathRequired: string
}

/**
 * The user's profile details plus the path they pick. The details go to
 * user-service; selectedPath goes to onboarding-service.
 */
export const createChooseYourPathSchema = (
  messages: ChooseYourPathValidationMessages
) =>
  userDetailsObjectSchema(messages)
    .extend({
      selectedPath: z.enum(
        USER_ONBOARDING_SELECTED_PATHS,
        messages.selectedPathRequired
      ),
    })
    .superRefine(refineUserDetails(messages))

export type ChooseYourPathFormValues = z.input<
  ReturnType<typeof createChooseYourPathSchema>
>
