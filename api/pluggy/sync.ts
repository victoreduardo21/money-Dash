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
    const { itemId, userId } = req.body || {};
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId é obrigatório' });
    }

    const pluggyClient = new PluggyClient({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    });

    let itemData: any = null;
    try {
      itemData = await pluggyClient.fetchItem(itemId);
    } catch (e: any) {
      console.warn(`[Pluggy Sync] fetchItem(${itemId}) warning:`, e.message);
    }

    const connector = itemData?.connector || null;
    const bankName = connector?.name || 'Banco Conectado';

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
        balance: Math.round(Number(acc.balance || 0) * 100) / 100,
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
              // ignore
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
        console.warn(`[Pluggy Sync] fetchTransactions error for ${acc.id}:`, txErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      item: itemData,
      bankName,
      accounts,
      transactions: allTransactions,
    });
  } catch (error: any) {
    console.error('[API /api/pluggy/sync] Error:', error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao sincronizar contas da Pluggy',
    });
  }
}
