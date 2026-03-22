import { Request, Response } from "express";
import { getStripe } from "../../lib/stripe.js";
import prisma from "../../db/client.js";

export const getBillingStatus = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  
  try {
    const entitlement = await prisma.entitlement.findFirst({
      where: { userId: user.id },
      orderBy: { currentPeriodEnd: 'desc' }
    });

    if (!entitlement) {
      res.json({ active: false, planId: "free" });
      return;
    }

    const isActive = entitlement.status === "active" || entitlement.status === "trialing";
    
    res.json({
      active: isActive,
      planId: entitlement.planId,
      status: entitlement.status,
      currentPeriodEnd: entitlement.currentPeriodEnd,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch billing status" });
  }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Billing is not configured on this server." });
    return;
  }

  const user = req.user!;
  const { priceId, successUrl, cancelUrl } = req.body;

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/billing?canceled=true`,
      client_reference_id: user.id, // Used in the webhook to link the subscription to the user
      customer_email: user.email,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Session Error:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
};

export const createPortalSession = async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Billing is not configured on this server." });
    return;
  }

  const user = req.user!;

  try {
    // Find the Stripe customer ID via the entitlement table
    const entitlement = await prisma.entitlement.findFirst({
      where: { userId: user.id, provider: "stripe" },
      orderBy: { currentPeriodEnd: "desc" }
    });

    if (!entitlement || !entitlement.providerSubscriptionId) {
      res.status(400).json({ error: "No active subscription found to manage." });
      return;
    }

    // Retrieve subscription from Stripe to reliably get the Customer ID
    const sub = await stripe.subscriptions.retrieve(entitlement.providerSubscriptionId);
    if (!sub || !sub.customer) {
      res.status(404).json({ error: "Subscription could not be fetched from Stripe." });
      return;
    }

    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/billing`, // Redirect back to AuthHub billing page
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal Session Error:", error);
    res.status(500).json({ error: error.message || "Failed to create portal session" });
  }
};
