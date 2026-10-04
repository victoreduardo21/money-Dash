import { PluggyClient } from 'pluggy-sdk';

const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || 'a4a26fd8-a803-4985-be8d-f56a0f3aa868';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || 'rtJpjYaHbOIvpU64J8AfoAtu17471qQN_hiOoppefRk';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = new PluggyClient({
    clientId: PLUGGY_CLIENT_ID,
    clientSecret: PLUGGY_CLIENT_SECRET,
  });

  // GET: List all webhooks currently registered in Pluggy
  if (req.method === 'GET') {
    try {
      const response = await client.fetchWebhooks();
      return res.status(200).json({
        success: true,
        webhooks: response.results,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST: Register or update webhook in Pluggy
  if (req.method === 'POST') {
    try {
      const { url, event = 'all' } = req.body || {};
      const targetUrl = url || 'https://moneydashs.com/api/webhooks/pluggy';

      // Check if already registered
      const existing = await client.fetchWebhooks();
      const match = existing.results.find(w => w.url === targetUrl && w.event === event);

      if (match) {
        return res.status(200).json({
          success: true,
          message: 'Webhook já cadastrado e ativo na Pluggy',
          webhook: match,
        });
      }

      // Create new webhook
      const newWebhook = await client.createWebhook(event as any, targetUrl);
      return res.status(200).json({
        success: true,
        message: 'Webhook registrado com sucesso na Pluggy',
        webhook: newWebhook,
      });
    } catch (error: any) {
      console.error('[API /api/pluggy/webhooks] Error:', error.message || error);
      return res.status(500).json({ success: false, error: error.message || 'Falha ao registrar webhook' });
    }
  }

  // DELETE: Remove a webhook
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ success: false, error: 'id é obrigatório' });
      await client.deleteWebhook(id);
      return res.status(200).json({ success: true, message: 'Webhook removido' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
