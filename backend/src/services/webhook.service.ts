import crypto from "crypto";
import prisma from "../db/client.js";
import pino from "pino";

const logger = pino();

export interface WebhookEvent {
    event: string;
    payload: any;
    tenantId?: string;
}

class WebhookService {
    /**
     * Dispatch an event to all subscribed webhook endpoints
     */
    async dispatch(event: WebhookEvent) {
        try {
            // Find all active endpoints for this tenant (or global ones if tenantId is null)
            const endpoints = await prisma.webhookEndpoint.findMany({
                where: {
                    tenantId: event.tenantId || null,
                    isActive: true,
                    events: {
                        has: event.event
                    }
                }
            });

            if (endpoints.length === 0) return;

            logger.info({ event: event.event, count: endpoints.length }, "Dispatching webhook event");

            // Send to each endpoint in parallel
            await Promise.all(endpoints.map(endpoint => this.deliver(endpoint, event)));
        } catch (error) {
            logger.error({ error, event: event.event }, "Failed to dispatch webhook event");
        }
    }

    /**
     * Deliver a specific event to a specific endpoint
     */
    private async deliver(endpoint: any, event: WebhookEvent) {
        const startTime = Date.now();
        const payloadStr = JSON.stringify({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            event: event.event,
            payload: event.payload
        });

        // Generate HMAC signature
        const signature = crypto
            .createHmac("sha256", endpoint.secret)
            .update(payloadStr)
            .digest("hex");

        try {
            const response = await fetch(endpoint.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "AuthHub-Webhook/1.0",
                    "X-AuthHub-Event": event.event,
                    "X-AuthHub-Signature": signature
                },
                body: payloadStr,
                // Short timeout to prevent hanging the event loop
                signal: AbortSignal.timeout(10000)
            });

            const responseBody = await response.text();
            const durationMs = Date.now() - startTime;

            // Log the delivery
            await prisma.webhookDelivery.create({
                data: {
                    webhookEndpointId: endpoint.id,
                    event: event.event,
                    payload: event.payload,
                    statusCode: response.status,
                    responseBody: responseBody.substring(0, 2000), // Cap size
                    durationMs
                }
            });

            logger.info({ url: endpoint.url, status: response.status }, "Webhook delivered");
        } catch (error: any) {
            const durationMs = Date.now() - startTime;
            
            // Log failed delivery
            await prisma.webhookDelivery.create({
                data: {
                    webhookEndpointId: endpoint.id,
                    event: event.event,
                    payload: event.payload,
                    errorMessage: error.message,
                    durationMs
                }
            });

            logger.error({ url: endpoint.url, error: error.message }, "Webhook delivery failed");
        }
    }
}

export const webhookService = new WebhookService();
