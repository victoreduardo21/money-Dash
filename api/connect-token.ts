import { PluggyClient } from 'pluggy-sdk';

const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || 'a4a26fd8-a803-4985-be8d-f56a0f3aa868';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || 'rtJpjYaHbOIvpU64J8AfoAtu17471qQN_hiOoppefRk';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new PluggyClient({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    });

    const { clientUserId, webhookUrl } = req.body || {};
    const connectToken = await client.createConnectToken(undefined, {
      clientUserId: clientUserId || undefined,
      webhookUrl: webhookUrl || undefined,
    });

    return res.status(200).json({
      success: true,
      accessToken: connectToken.accessToken,
    });
  } catch (error: any) {
    console.error('[API /api/connect-token] Error:', error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao gerar Connect Token na Pluggy',
    });
  }
}
