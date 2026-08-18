"use client";

import { setAddresses } from "@/lib/data/checkout";
import {
  WESTERN_US_STATES,
  type SetAddressesState,
} from "@/lib/data/checkout-address";
import { cn } from "@/lib/utils/cn";
import { HttpTypes } from "@medusajs/types";
import { useActionState, useState } from "react";

type CartAddress = NonNullable<HttpTypes.StoreCart["shipping_address"]>;

type AddressFormProps = {
  cart: HttpTypes.StoreCart;
};

type AddressFieldProps = {
  name: string;
  label: string;
  errors?: string[];
  required?: boolean;
  type?: string;
  defaultValue?: string;
  className?: string;
};

const initialState: SetAddressesState = { fieldErrors: {}, formError: null };

/** Rough heuristic for whether a cart's billing address was originally set as "same as shipping". */
function isSameAddress(a?: CartAddress | null, b?: CartAddress | null): boolean {
  if (!a || !b) {
    return false;
  }
  return a.address_1 === b.address_1 && a.postal_code === b.postal_code;
}

function AddressField({
  name,
  label,
  errors,
  required,
  type = "text",
  defaultValue,
  className,
}: AddressFieldProps) {
  return (
    <div className={className}>
      <label className="floating-label">
        <input
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={label}
          className={cn("input w-full", errors?.length && "input-error")}
        />
        <span>
          {label}
          {required && <span className="text-error">*</span>}
        </span>
      </label>
      {errors?.map((message) => (
        <p key={message} className="text-error mt-1 text-sm">
          {message}
        </p>
      ))}
    </div>
  );
}

function AddressForm({ cart }: AddressFormProps) {
  const [state, formAction, pending] = useActionState(setAddresses, initialState);
  const [sameAsBilling, setSameAsBilling] = useState(
    () => !cart.billing_address || isSameAddress(cart.shipping_address, cart.billing_address),
  );
  const { fieldErrors, formError } = state;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-2xl font-semibold">
          Shipping Address
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AddressField
            name="shipping_address.first_name"
            label="First name"
            required
            defaultValue={cart.shipping_address?.first_name ?? undefined}
            errors={fieldErrors["shipping_address.first_name"]}
          />
          <AddressField
            name="shipping_address.last_name"
            label="Last name"
            required
            defaultValue={cart.shipping_address?.last_name ?? undefined}
            errors={fieldErrors["shipping_address.last_name"]}
          />
          <AddressField
            name="shipping_address.address_1"
            label="Address"
            required
            className="sm:col-span-2"
            defaultValue={cart.shipping_address?.address_1 ?? undefined}
            errors={fieldErrors["shipping_address.address_1"]}
          />
          <AddressField
            name="shipping_address.company"
            label="Company"
            defaultValue={cart.shipping_address?.company ?? undefined}
            errors={fieldErrors["shipping_address.company"]}
          />
          <AddressField
            name="shipping_address.postal_code"
            label="Postal code"
            required
            defaultValue={cart.shipping_address?.postal_code ?? undefined}
            errors={fieldErrors["shipping_address.postal_code"]}
          />
          <AddressField
            name="shipping_address.city"
            label="City"
            required
            defaultValue={cart.shipping_address?.city ?? undefined}
            errors={fieldErrors["shipping_address.city"]}
          />
          <div>
            <select
              name="shipping_address.province"
              required
              defaultValue={cart.shipping_address?.province ?? ""}
              className={cn(
                "select w-full",
                fieldErrors["shipping_address.province"]?.length && "select-error",
              )}
            >
              <option value="" disabled>
                State / Province
              </option>
              {WESTERN_US_STATES.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
            {fieldErrors["shipping_address.province"]?.map((message) => (
              <p key={message} className="text-error mt-1 text-sm">
                {message}
              </p>
            ))}
          </div>
          <div>
            {/* A `disabled` select is excluded from FormData entirely,
                so the actual submitted value comes from this hidden
                input instead — the select is display-only. */}
            <input type="hidden" name="shipping_address.country_code" value="us" />
            <select defaultValue="us" disabled className="select w-full">
              <option value="us">United States</option>
            </select>
          </div>
        </div>
      </fieldset>

      <label className="flex w-fit cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name="same_as_billing"
          className="checkbox"
          checked={sameAsBilling}
          onChange={(e) => setSameAsBilling(e.target.checked)}
        />
        Billing address same as shipping
      </label>

      {!sameAsBilling && (
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-2xl font-semibold">
            Billing Address
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AddressField
              name="billing_address.first_name"
              label="First name"
              required
              defaultValue={cart.billing_address?.first_name ?? undefined}
              errors={fieldErrors["billing_address.first_name"]}
            />
            <AddressField
              name="billing_address.last_name"
              label="Last name"
              required
              defaultValue={cart.billing_address?.last_name ?? undefined}
              errors={fieldErrors["billing_address.last_name"]}
            />
            <AddressField
              name="billing_address.address_1"
              label="Address"
              required
              className="sm:col-span-2"
              defaultValue={cart.billing_address?.address_1 ?? undefined}
              errors={fieldErrors["billing_address.address_1"]}
            />
            <AddressField
              name="billing_address.company"
              label="Company"
              defaultValue={cart.billing_address?.company ?? undefined}
              errors={fieldErrors["billing_address.company"]}
            />
            <AddressField
              name="billing_address.postal_code"
              label="Postal code"
              required
              defaultValue={cart.billing_address?.postal_code ?? undefined}
              errors={fieldErrors["billing_address.postal_code"]}
            />
            <AddressField
              name="billing_address.city"
              label="City"
              required
              defaultValue={cart.billing_address?.city ?? undefined}
              errors={fieldErrors["billing_address.city"]}
            />
            <AddressField
              name="billing_address.province"
              label="State / Province"
              required
              defaultValue={cart.billing_address?.province ?? undefined}
              errors={fieldErrors["billing_address.province"]}
            />
            <div>
              <input type="hidden" name="billing_address.country_code" value="us" />
              <select defaultValue="us" disabled className="select w-full">
                <option value="us">United States</option>
              </select>
            </div>
          </div>
        </fieldset>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AddressField
          name="email"
          label="Email"
          type="email"
          required
          defaultValue={cart.email ?? undefined}
          errors={fieldErrors["email"]}
        />
        <AddressField
          name="shipping_address.phone"
          label="Phone"
          type="tel"
          defaultValue={cart.shipping_address?.phone ?? undefined}
          errors={fieldErrors["shipping_address.phone"]}
        />
      </div>

      {formError && (
        <div role="alert" className="alert alert-error">
          <span>{formError}</span>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-accent w-fit uppercase"
        disabled={pending}
      >
        {pending ? "Saving…" : "Continue to delivery"}
      </button>
    </form>
  );
}

export default AddressForm;
