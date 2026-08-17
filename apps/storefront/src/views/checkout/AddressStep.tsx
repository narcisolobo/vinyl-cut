import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { HttpTypes } from "@medusajs/types";
import AddressForm from "./AddressForm";
import AddressSummary from "./AddressSummary";
import { isAddressComplete } from "./types";

type AddressStepProps = {
  cart: HttpTypes.StoreCart;
  isOpen: boolean;
};

function AddressStep({ cart, isOpen }: AddressStepProps) {
  const isComplete = isAddressComplete(cart);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        Address
        {isComplete && (
          <CheckCircleIcon className="text-success" weight="fill" />
        )}
      </h2>
      {isOpen ? <AddressForm cart={cart} /> : <AddressSummary cart={cart} />}
    </section>
  );
}

export default AddressStep;
