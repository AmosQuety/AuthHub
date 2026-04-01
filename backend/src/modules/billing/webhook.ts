import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import prisma from "../../db/client.js";
import { AuditService } from "../../core/audit.js";

import { getStripe } from "../../lib/stripe.js";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const stripe = getStripe();

  if (!stripe) {
    // Stripe not configured — skip gracefully in dev
    res.status(503).json({ error: "Billing not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"];

  if (!sig || !webhookSecret) {
    res.status(400).send("Webhook missing signature or secret");
    return;
  }

  let event: Stripe.Event;

  try {
    // Because Stripe requires the raw body to verify signatures, 
    // the router must use express.raw({ type: 'application/json' }) before hitting this controller.
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.customer || !session.subscription) break;
        
        // You might map a Stripe Customer ID to a User ID using client-reference-id if passed
        const userId = session.client_reference_id;
        if (!userId) break;

        // Fetch subscription immediately to get details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const planId = subscription.items.data[0].plan.id;

        await prisma.entitlement.upsert({
          where: { providerSubscriptionId: subscription.id },
          create: {
            userId,
            provider: "stripe",
            providerSubscriptionId: subscription.id,
            planId: planId,
            status: subscription.status,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          },
          update: {
            status: subscription.status,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            planId: planId,
          }
        });

        AuditService.log({
          userId: userId,
          action: "ENTITLEMENT_CREATED",
          status: "SUCCESS",
          details: { provider: "stripe", planId }
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const existingToken = await prisma.entitlement.findUnique({
          where: { providerSubscriptionId: subscription.id }
        });

        if (!existingToken) {
           break; // We don't track this subscription, ignore
        }

        const planId = subscription.items.data[0].plan.id;

        await prisma.entitlement.update({
          where: { providerSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            planId: planId,
          }
        });

        AuditService.log({
          userId: existingToken.userId,
          action: event.type === "customer.subscription.deleted" ? "ENTITLEMENT_REVOKED" : "ENTITLEMENT_UPDATED",
          status: "SUCCESS",
          details: { provider: "stripe", planId, status: subscription.status }
        });
        break;
      }
      default:
        // Unhandled event type
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal Server Error processing webhook");
  }
};
