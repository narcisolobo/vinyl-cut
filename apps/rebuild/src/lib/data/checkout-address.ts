import { z } from "zod";

/**
 * States within the shop's Western U.S. shipping/tax region (PRD:
 * "Shipping region restriction"). Checkout only accepts shipping
 * addresses within these states; billing is unrestricted.
 */
const WESTERN_US_STATES = [
  "CA",
  "OR",
  "WA",
  "NV",
  "AZ",
  "CO",
  "UT",
  "NM",
] as const;
type WesternUsState = (typeof WESTERN_US_STATES)[number];

function isWesternUsState(value: string): value is WesternUsState {
  return (WESTERN_US_STATES as readonly string[]).includes(value);
}

/**
 * Shared shape for both the shipping and billing address. Required
 * fields are this project's own business decision — Medusa's
 * `StoreAddAddress` type marks every field as optional.
 */
const AddressSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  last_name: z.string().trim().min(1, "Last name is required."),
  address_1: z.string().trim().min(1, "Address is required."),
  address_2: z.string().trim(),
  company: z.string().trim(),
  city: z.string().trim().min(1, "City is required."),
  postal_code: z.string().trim().min(1, "Postal code is required."),
  province: z.string().trim().min(1, "State is required.").toUpperCase(),
  country_code: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .toLowerCase(),
  phone: z.string().trim(),
});

/**
 * Shipping address, plus the Western U.S. shipping-region
 * restriction. The `province`/`country_code` guard below skips the
 * region check when either is already blank — Zod's built-in checks
 * (like `.min()`) don't abort by default, so without the guard a
 * blank state would also get a redundant "not a valid state" issue
 * stacked on top of the "state is required" one.
 */
const ShippingAddressSchema = AddressSchema.superRefine((address, ctx) => {
  if (!address.country_code || !address.province) {
    return;
  }

  if (address.country_code !== "us") {
    ctx.addIssue({
      code: "custom",
      path: ["country_code"],
      message: "We currently only ship within the United States.",
    });
    return;
  }

  if (!isWesternUsState(address.province)) {
    ctx.addIssue({
      code: "custom",
      path: ["province"],
      message: "We currently only ship to CA, OR, WA, NV, AZ, CO, UT, or NM.",
    });
  }
});

const SetSharedAddressSchema = z.object({
  email: z.email("Enter a valid email address."),
  shipping_address: ShippingAddressSchema,
});

const SetAddressesSchema = SetSharedAddressSchema.extend({
  billing_address: AddressSchema,
});

/** Per-field validation messages, keyed by dotted path (e.g. `"shipping_address.postal_code"`). */
type SetAddressesFieldErrors = Record<string, string[]>;

/**
 * The shape `setAddresses` returns on failure. On success it never
 * returns — it redirects instead. `formError` covers failures not
 * tied to one field (missing form data, no cart, a Medusa error);
 * `fieldErrors` covers per-field validation failures.
 */
type SetAddressesState = {
  fieldErrors: SetAddressesFieldErrors;
  formError: string | null;
};

/** Maps a `ZodError`'s issues to `SetAddressesFieldErrors`, keyed by dotted path. */
function toFieldErrors(error: z.ZodError): SetAddressesFieldErrors {
  const fieldErrors: SetAddressesFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }

  return fieldErrors;
}

export { SetSharedAddressSchema, SetAddressesSchema, toFieldErrors };
export type { SetAddressesState };
