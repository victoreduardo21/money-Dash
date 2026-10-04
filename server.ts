import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { PluggyClient } from 'pluggy-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);

// Pluggy Client initialization
const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || 'a4a26fd8-a803-4985-be8d-f56a0f3aa868';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || 'rtJpjYaHbOIvpU64J8AfoAtu17471qQN_hiOoppefRk';

let pluggyClient: PluggyClient | null = null;
try {
  pluggyClient = new PluggyClient({
    clientId: PLUGGY_CLIENT_ID,
    clientSecret: PLUGGY_CLIENT_SECRET,
  });
} catch (err) {
  console.error('[Pluggy] Failed to initialize PluggyClient:', err);
}

// In-memory cache for recent webhook events
const recentWebhookEvents: any[] = [];

// Helper: Synchronize an item's real accounts & transactions directly from Pluggy
async function syncPluggyItem(itemId: string, userId?: string) {
  if (!pluggyClient) {
    pluggyClient = new PluggyClient({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    });
  }

  // 1. Fetch Item details (Bank Name, status)
  let itemData: any = null;
  try {
    itemData = await pluggyClient.fetchItem(itemId);
  } catch (e: any) {
    console.warn(`[Pluggy Sync] fetchItem(${itemId}) warning:`, e.message);
  }

  const connector = itemData?.connector || null;
  const bankName = connector?.name || 'Banco Conectado';

  // 2. Fetch all real accounts for this item
  const accountsResponse = await pluggyClient.fetchAccounts(itemId);
  const rawAccounts: any[] = accountsResponse.results || [];

  const accounts: any[] = [];
  const allTransactions: any[] = [];

  for (const acc of rawAccounts) {
    const isCreditCard = acc.type === 'CREDIT';
    const isInvestment = String(acc.type) === 'INVESTMENT';

    const accountObj = {
      id: acc.id,
      itemId: acc.itemId,
      type: isCreditCard ? 'CREDIT' : isInvestment ? 'INVESTMENT' : 'BANK',
      subtype: acc.subtype || (isCreditCard ? 'CREDIT_CARD' : isInvestment ? 'INVESTMENT_ACCOUNT' : 'CHECKING_ACCOUNT'),
      name: acc.name || `${bankName} ${isCreditCard ? 'Cartão' : 'Conta'}`,
      balance: Math.round(Number(acc.balance || 0) * 100) / 100, // REAL BANK BALANCE
      currencyCode: acc.currencyCode || 'BRL',
      bankName: acc.bankData?.institutionName || (acc.bankData as any)?.name || bankName,
      accountNumber: acc.number || '••••',
      agency: (acc as any).agency || undefined,
      creditLimit: acc.creditData?.creditLimit ? Number(acc.creditData.creditLimit) : undefined,
      availableCreditLimit: acc.creditData?.availableCreditLimit ? Number(acc.creditData.availableCreditLimit) : undefined,
      userId: userId || undefined,
      color: connector?.primaryColor || '#4F46E5',
      autoSyncTransactions: true,
      updatedAt: new Date().toISOString(),
    };
    accounts.push(accountObj);

    // 3. Fetch real transactions for this account
    try {
      const txResponse = await pluggyClient.fetchTransactions(acc.id, {
        pageSize: 100,
      });

      const rawTxs = txResponse.results || [];
      for (const tx of rawTxs) {
        const rawAmt = Number(tx.amount) || 0;
        const isCredit = tx.type === 'CREDIT' || (tx.type !== 'DEBIT' && rawAmt > 0);
        const positiveAmount = Math.round(Math.abs(rawAmt) * 100) / 100;

        let formattedDate = new Date().toISOString().split('T')[0];
        if (tx.date) {
          try {
            formattedDate = new Date(tx.date).toISOString().split('T')[0];
          } catch (e) {
            // fallback
          }
        }

        allTransactions.push({
          id: tx.id,
          accountId: acc.id,
          itemId: acc.itemId,
          bankName: accountObj.bankName,
          description: (tx.description || tx.descriptionRaw || 'Movimentação Bancária').trim(),
          amount: positiveAmount,
          date: formattedDate,
          category: tx.category || (isCredit ? 'Receita Bancária' : 'Despesa Bancária'),
          type: isCredit ? 'CREDIT' : 'DEBIT',
          status: tx.status || 'POSTED',
          userId: userId || undefined,
          imported: false,
        });
      }
    } catch (txErr: any) {
      console.warn(`[Pluggy Sync] fetchTransactions for account ${acc.id} error:`, txErr.message);
    }
  }

  return { itemData, bankName, accounts, transactions: allTransactions };
}

// 1. Generate Connect Token for the Pluggy Connect Widget
app.post('/api/connect-token', async (req, res) => {
  try {
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }

    const { clientUserId, webhookUrl } = req.body || {};
    const connectToken = await pluggyClient.createConnectToken(undefined, {
      clientUserId: clientUserId || undefined,
      webhookUrl: webhookUrl || undefined,
    });

    return res.json({
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
});

// Alias endpoint for /api/pluggy/connect-token
app.post('/api/pluggy/connect-token', async (req, res) => {
  try {
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }

    const { clientUserId } = req.body || {};
    const connectToken = await pluggyClient.createConnectToken(undefined, {
      clientUserId: clientUserId || undefined,
    });

    return res.json({
      success: true,
      accessToken: connectToken.accessToken,
    });
  } catch (error: any) {
    console.error('[API /api/pluggy/connect-token] Error:', error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao gerar Connect Token',
    });
  }
});

// 2. Sync an Item (Fetch real bank accounts & real transactions)
app.post('/api/pluggy/sync', async (req, res) => {
  try {
    const { itemId, userId } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId é obrigatório' });
    }

    const result = await syncPluggyItem(itemId, userId);
    if (!result) {
      return res.status(500).json({ success: false, error: 'Falha ao inicializar cliente Pluggy' });
    }

    return res.json({
      success: true,
      item: result.itemData,
      bankName: result.bankName,
      accounts: result.accounts,
      transactions: result.transactions,
    });
  } catch (error: any) {
    console.error('[API /api/pluggy/sync] Error:', error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao sincronizar contas da Pluggy',
    });
  }
});

// 3. Official Webhooks Handler requested by User (/api/webhooks/pluggy)
async function handleItemCreated(itemId: string) {
  console.log(`[Pluggy Webhook Handler] item/created: ${itemId}`);
  await syncPluggyItem(itemId);
}

async function handleItemUpdated(itemId: string) {
  console.log(`[Pluggy Webhook Handler] item/updated: ${itemId}`);
  await syncPluggyItem(itemId);
}

async function handleItemError(itemId: string, error: any) {
  console.error(`[Pluggy Webhook Handler] item/error: ${itemId}`, error);
}

// POST /api/webhooks/pluggy
app.post('/api/webhooks/pluggy', async (req, res) => {
  const event = req.body || {};

  console.log('Received webhook:', event.event);
  console.log('Event ID:', event.eventId);
  console.log('Item ID:', event.itemId);

  // Store in recent webhook memory
  recentWebhookEvents.unshift({
    event: event.event,
    eventId: event.eventId,
    itemId: event.itemId,
    error: event.error || null,
    receivedAt: new Date().toISOString(),
  });
  if (recentWebhookEvents.length > 30) recentWebhookEvents.pop();

  // IMPORTANT: Return 2XX within 5 seconds as required by Pluggy
  res.status(200).json({ received: true });

  // Process event in background
  try {
    switch (event.event) {
      case 'item/created':
        await handleItemCreated(event.itemId);
        break;
      case 'item/updated':
        await handleItemUpdated(event.itemId);
        break;
      case 'item/error':
        await handleItemError(event.itemId, event.error);
        break;
      case 'transactions/created':
        await handleItemUpdated(event.itemId);
        break;
      default:
        console.log(`[Pluggy Webhook] Received unhandled event: ${event.event}`);
    }
  } catch (bgError: any) {
    console.error('[Pluggy Webhook] Background execution error:', bgError.message || bgError);
  }
});

// GET /api/webhooks/pluggy (Status, testing & health check)
app.get('/api/webhooks/pluggy', (req, res) => {
  res.json({
    status: 'active',
    endpoint: '/api/webhooks/pluggy',
    supportedEvents: ['item/created', 'item/updated', 'item/error', 'transactions/created', 'all'],
    recentEvents: recentWebhookEvents.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
});

// List webhooks registered in Pluggy
app.get('/api/pluggy/webhooks', async (req, res) => {
  try {
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }
    const response = await pluggyClient.fetchWebhooks();
    return res.json({ success: true, webhooks: response.results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Register or ensure webhook in Pluggy
app.post('/api/pluggy/webhooks', async (req, res) => {
  try {
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }
    const { url, event = 'all' } = req.body || {};
    const targetUrl = url || 'https://moneydashs.com/api/webhooks/pluggy';

    const existing = await pluggyClient.fetchWebhooks();
    const match = existing.results.find(w => w.url === targetUrl && w.event === event);
    if (match) {
      return res.json({ success: true, message: 'Webhook já cadastrado', webhook: match });
    }

    const newWebhook = await pluggyClient.createWebhook(event as any, targetUrl);
    return res.json({ success: true, message: 'Webhook cadastrado com sucesso', webhook: newWebhook });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete webhook
app.delete('/api/pluggy/webhooks/:id', async (req, res) => {
  try {
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }
    await pluggyClient.deleteWebhook(req.params.id);
    return res.json({ success: true, message: 'Webhook removido' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. List Connectors (Brazilian Banks)
app.get('/api/pluggy/connectors', async (req, res) => {
  try {
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }

    const { name, sandbox } = req.query;
    const response = await pluggyClient.fetchConnectors({
      name: name ? String(name) : undefined,
      sandbox: sandbox === 'true',
    });

    return res.json({
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
});

// 5. Delete an item / bank connection
app.delete('/api/pluggy/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!pluggyClient) {
      pluggyClient = new PluggyClient({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      });
    }

    await pluggyClient.deleteItem(itemId);
    return res.json({ success: true, message: 'Item desconectado na Pluggy' });
  } catch (error: any) {
    console.error('[API DELETE /api/pluggy/item] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    pluggyReady: Boolean(PLUGGY_CLIENT_ID && PLUGGY_CLIENT_SECRET),
    webhookEndpoint: '/api/webhooks/pluggy',
    timestamp: new Date().toISOString(),
  });
});

// Vite Middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Pluggy Open Finance API initialized.`);
    console.log(`[Server] Webhook listening on /api/webhooks/pluggy`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
