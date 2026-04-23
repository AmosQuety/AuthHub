import Stripe from "stripe";

// Lazily resolved — avoids crashing on startup when STRIPE_SECRET_KEY is not yet configured.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover" as any,
    });
  }
  return _stripe;
}
