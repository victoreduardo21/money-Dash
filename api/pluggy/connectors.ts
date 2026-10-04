import { PluggyClient } from 'pluggy-sdk';

const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || 'a4a26fd8-a803-4985-be8d-f56a0f3aa868';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || 'rtJpjYaHbOIvpU64J8AfoAtu17471qQN_hiOoppefRk';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pluggyClient = new PluggyClient({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    });

    const { name, sandbox } = req.query || {};
    const response = await pluggyClient.fetchConnectors({
      name: name ? String(name) : undefined,
      sandbox: sandbox === 'true',
    });

    return res.status(200).json({
      success: true,
      connectors: response.results,
    });
  } catch (error: any) {
    console.error('[API /api/pluggy/connectors] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao buscar conectores',
    });
  }
}
