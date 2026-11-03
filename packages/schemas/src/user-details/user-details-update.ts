import {
  getCountryCallingCode,
  isSupportedCountry,
  isValidPhoneNumber,
} from "libphonenumber-js"
import {
  postcodeValidator,
  postcodeValidatorExistsForCountry,
} from "postcode-validator"
import { z } from "zod"

export const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const

export interface UserDetailsUpdateValidationMessages {
  phoneNumberRequired: string
  phoneNumberInvalid: string
  bioCountryRequired: string
  bioRequired: string
  bioTooLong: string
  addressLine1Required: string
  cityRequired: string
  stateRequired: string
  postalCodeRequired: string
  postalCodeInvalid: string
  genderRequired: string
  dobRequired: string
  timeZoneRequired: string
}

type Messages = Partial<UserDetailsUpdateValidationMessages>

/** Whether the country uses postal codes, e.g. India yes, the UAE no. */
export const countryUsesPostalCode = (country: string) =>
  postcodeValidatorExistsForCountry(country.toUpperCase())

/**
 * The fields alone. Kept apart from the cross-field checks below because
 * Zod can't `.extend()` a schema that has refinements.
 */
export const userDetailsObjectSchema = (messages: Messages = {}) =>
  z.object({
    phoneNumber: z.string().trim().min(1, messages.phoneNumberRequired),
    // ISO 3166-1 alpha-2, e.g. "IN"; the phone and postal code are checked
    // against it.
    bioCountry: z.string().trim().min(1, messages.bioCountryRequired),
    bio: z
      .string()
      .trim()
      .min(1, messages.bioRequired)
      .max(1000, messages.bioTooLong),
    gender: z.enum(GENDERS, messages.genderRequired),
    // A calendar date, YYYY-MM-DD, since JSON has no date type.
    dob: z.iso.date(messages.dobRequired),
    addressLine1: z.string().trim().min(1, messages.addressLine1Required),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(1, messages.cityRequired),
    state: z.string().trim().min(1, messages.stateRequired),
    // Required only where the country uses postal codes; see below.
    postalCode: z.string().trim(),
    languageCode: z.string().trim().default("en"),
    timeZone: z.string().trim().min(1, messages.timeZoneRequired),
  })

/**
 * Checks that depend on the country:
 * - The phone number must be valid (length and number ranges) and use the
 *   country's calling code. libphonenumber ignores the country for numbers
 *   starting with "+", so a valid US number would otherwise pass for India.
 *   Calling codes rather than countries are compared because some are
 *   shared, e.g. +1 for the US and Canada.
 * - The postal code must match the country's format, e.g. 6 digits for
 *   India, "SW1A 1AA" for the UK. Countries without postal codes (e.g. the
 *   UAE) may leave it blank.
 */
export const refineUserDetails =
  (messages: Messages = {}) =>
  (
    data: { phoneNumber: string; bioCountry: string; postalCode: string },
    ctx: z.RefinementCtx
  ) => {
    const country = data.bioCountry.toUpperCase()

    if (data.phoneNumber && country) {
      const matchesCountry =
        isSupportedCountry(country) &&
        data.phoneNumber.startsWith(`+${getCountryCallingCode(country)}`)

      if (!matchesCountry || !isValidPhoneNumber(data.phoneNumber, country)) {
        ctx.addIssue({
          code: "custom",
          path: ["phoneNumber"],
          message: messages.phoneNumberInvalid,
        })
      }
    }

    if (country && countryUsesPostalCode(country)) {
      if (!data.postalCode) {
        ctx.addIssue({
          code: "custom",
          path: ["postalCode"],
          message: messages.postalCodeRequired,
        })
      } else if (!postcodeValidator(data.postalCode, country)) {
        ctx.addIssue({
          code: "custom",
          path: ["postalCode"],
          message: messages.postalCodeInvalid,
        })
      }
    }
  }

/**
 * PUT /user/user-details. The admin app passes translated messages; services
 * call it without any and get Zod's defaults.
 */
export const updateUserDetailsSchema = (messages: Messages = {}) =>
  userDetailsObjectSchema(messages).superRefine(refineUserDetails(messages))

export type UpdateUserDetailsFormValues = z.input<
  ReturnType<typeof updateUserDetailsSchema>
>

export type UpdateUserDetailsInput = z.output<
  ReturnType<typeof updateUserDetailsSchema>
>
