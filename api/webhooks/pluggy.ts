import { PluggyClient } from 'pluggy-sdk';

const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || 'a4a26fd8-a803-4985-be8d-f56a0f3aa868';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || 'rtJpjYaHbOIvpU64J8AfoAtu17471qQN_hiOoppefRk';

/**
 * Universal Pluggy Webhook Handler
 * Compatible with Vercel Serverless Functions, Node.js, and Next.js
 * 
 * Target URL for Pluggy Dashboard:
 * https://moneydashs.com/api/webhooks/pluggy
 */

// Vercel Serverless Function Handler (Node.js)
export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).end();
  }

  // GET request: Health check and verification ping from Pluggy or browser
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Money Dashs - Pluggy Webhook',
      endpoint: '/api/webhooks/pluggy',
      supportedEvents: [
        'item/created',
        'item/updated',
        'item/error',
        'item/deleted',
        'item/waiting_user_input',
        'transactions/created'
      ],
      timestamp: new Date().toISOString(),
    });
  }

  // POST request: Pluggy webhook notification
  if (req.method === 'POST') {
    const event = req.body || {};
    console.log('[Pluggy Webhook] Received:', event.event, 'EventID:', event.eventId, 'ItemID:', event.itemId);

    // CRITICAL: Respond 200 within 5 seconds to satisfy Pluggy's webhook delivery requirement
    res.status(200).json({
      received: true,
      event: event.event,
      eventId: event.eventId,
      itemId: event.itemId,
      timestamp: new Date().toISOString(),
    });

    // Asynchronous background processing
    try {
      if (event.itemId) {
        const client = new PluggyClient({
          clientId: PLUGGY_CLIENT_ID,
          clientSecret: PLUGGY_CLIENT_SECRET,
        });
        console.log(`[Pluggy Webhook] Successfully acknowledged event ${event.event} for item ${event.itemId}`);
      }
    } catch (bgError: any) {
      console.error('[Pluggy Webhook] Background task error:', bgError.message || bgError);
    }
    return;
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Next.js App Router compatibility (if deployed in Next.js)
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'active',
      service: 'Money Dashs - Pluggy Webhook',
      endpoint: '/api/webhooks/pluggy',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const event = await req.json();
    console.log('[Pluggy Webhook Next] Received:', event.event, 'ItemID:', event.itemId);

    return new Response(
      JSON.stringify({
        received: true,
        event: event.event,
        eventId: event.eventId,
        itemId: event.itemId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
