import { z } from "zod";

const RestockSubscriptionSchema = z.object({
  variant_id: z.string().min(1),
  email: z.email("Enter a valid email address."),
});

type RestockSubscriptionState = {
  status: "idle" | "success" | "error";
  emailError: string | null;
  formError: string | null;
};

export { RestockSubscriptionSchema };
export type { RestockSubscriptionState };
