import { BankAccount, BankTransaction, Currency } from '../types';

export interface ParsedBankStatement {
  bankName: string;
  accountNumber: string;
  agency?: string;
  balance: number;
  transactions: BankTransaction[];
}

/**
 * Robust parser for Brazilian Bank OFX and CSV files (Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, Caixa, etc.)
 */
export class BankStatementParser {
  /**
   * Parse OFX format (standard format exported by all Brazilian banks)
   */
  static parseOFX(ofxContent: string, fallbackBankName: string = 'Banco Conectado', userId: string): ParsedBankStatement {
    let bankName = fallbackBankName;
    let accountNumber = 'Conta Principal';
    let agency = '';
    let balance = 0;
    const transactions: BankTransaction[] = [];

    // Detect Bank from Org or BankId
    const orgMatch = ofxContent.match(/<ORG>(.*?)<\/ORG>/i) || ofxContent.match(/<ORG>([^\r\n<]+)/i);
    const bankIdMatch = ofxContent.match(/<BANKID>(.*?)<\/BANKID>/i) || ofxContent.match(/<BANKID>([^\r\n<]+)/i);
    if (orgMatch && orgMatch[1]) {
      bankName = orgMatch[1].trim();
    } else if (bankIdMatch && bankIdMatch[1]) {
      const code = bankIdMatch[1].trim();
      if (code === '260' || code.includes('NUBANK')) bankName = 'Nubank';
      else if (code === '341' || code.includes('ITAU')) bankName = 'Itaú Unibanco';
      else if (code === '237' || code.includes('BRADESCO')) bankName = 'Bradesco';
      else if (code === '001' || code.includes('BRASIL')) bankName = 'Banco do Brasil';
      else if (code === '033' || code.includes('SANTANDER')) bankName = 'Santander';
      else if (code === '077' || code.includes('INTER')) bankName = 'Banco Inter';
      else if (code === '104' || code.includes('CAIXA')) bankName = 'Caixa Econômica';
    }

    // Account Number
    const acctMatch = ofxContent.match(/<ACCTID>(.*?)<\/ACCTID>/i) || ofxContent.match(/<ACCTID>([^\r\n<]+)/i);
    if (acctMatch && acctMatch[1]) {
      accountNumber = acctMatch[1].trim();
    }

    // Ledger Balance
    const balMatch = ofxContent.match(/<BALAMT>(.*?)<\/BALAMT>/i) || ofxContent.match(/<BALAMT>([^\r\n<]+)/i);
    if (balMatch && balMatch[1]) {
      const parsedBal = parseFloat(balMatch[1].trim().replace(',', '.'));
      if (!isNaN(parsedBal)) {
        balance = parsedBal;
      }
    }

    // Transactions (<STMTTRN>...</STMTTRN>)
    const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
    let match;
    let runningCalcBalance = 0;

    while ((match = trnRegex.exec(ofxContent)) !== null) {
      const trnBlock = match[1];
      if (!trnBlock || !trnBlock.trim()) continue;

      // Type: DEBIT / CREDIT / OTHER
      const typeMatch = trnBlock.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/i) || trnBlock.match(/<TRNTYPE>([^\r\n<]+)/i);
      const rawType = (typeMatch ? typeMatch[1].trim() : '').toUpperCase();

      // Amount
      const amtMatch = trnBlock.match(/<TRNAMT>(.*?)<\/TRNAMT>/i) || trnBlock.match(/<TRNAMT>([^\r\n<]+)/i);
      if (!amtMatch) continue;
      const rawAmt = parseFloat(amtMatch[1].trim().replace(',', '.'));
      if (isNaN(rawAmt)) continue;

      // Date posted: YYYYMMDD...
      const dtMatch = trnBlock.match(/<DTPOSTED>(.*?)<\/DTPOSTED>/i) || trnBlock.match(/<DTPOSTED>([^\r\n<]+)/i);
      let dateStr = new Date().toISOString().slice(0, 10);
      if (dtMatch && dtMatch[1]) {
        const rawDate = dtMatch[1].trim().slice(0, 8);
        if (rawDate.length === 8) {
          const y = rawDate.slice(0, 4);
          const m = rawDate.slice(4, 6);
          const d = rawDate.slice(6, 8);
          dateStr = `${y}-${m}-${d}`;
        }
      }

      // Memo or Name (Description)
      const memoMatch = trnBlock.match(/<MEMO>(.*?)<\/MEMO>/i) || trnBlock.match(/<MEMO>([^\r\n<]+)/i);
      const nameMatch = trnBlock.match(/<NAME>(.*?)<\/NAME>/i) || trnBlock.match(/<NAME>([^\r\n<]+)/i);
      let desc = (memoMatch ? memoMatch[1].trim() : '') || (nameMatch ? nameMatch[1].trim() : '') || 'Movimentação Bancária';

      // FITID (Unique Transaction ID from Bank)
      const fitidMatch = trnBlock.match(/<FITID>(.*?)<\/FITID>/i) || trnBlock.match(/<FITID>([^\r\n<]+)/i);
      const fitId = fitidMatch ? fitidMatch[1].trim() : ('tx_' + Math.random().toString(36).substring(2, 9));

      const isCredit = rawAmt > 0 || rawType === 'CREDIT' || rawType === 'DEP';
      const absAmount = Math.abs(rawAmt);

      runningCalcBalance += rawAmt;

      // Categorize automatically
      const category = this.categorizeDescription(desc);

      transactions.push({
        id: 'ofx_' + fitId,
        accountId: '',
        bankName,
        description: desc,
        amount: Math.round(absAmount * 100) / 100,
        date: dateStr,
        category,
        type: isCredit ? 'CREDIT' : 'DEBIT',
        status: 'POSTED',
        imported: false,
        userId
      });
    }

    // If balance was not explicitly defined in <BALAMT>, use the net of transactions
    if (balance === 0 && transactions.length > 0) {
      balance = Math.round(runningCalcBalance * 100) / 100;
    }

    return {
      bankName,
      accountNumber,
      agency,
      balance,
      transactions
    };
  }

  /**
   * Parse CSV format exported from bank internet banking
   */
  static parseCSV(csvContent: string, bankName: string = 'Banco Conectado', userId: string): ParsedBankStatement {
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    const transactions: BankTransaction[] = [];
    let balance = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Split by semicolon or comma (taking quotes into account)
      const parts = line.split(/[;,]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 3) continue;

      // Try to find date, description, amount
      let dateStr = '';
      let desc = '';
      let amtNum = 0;

      for (const part of parts) {
        // Date match DD/MM/YYYY or YYYY-MM-DD
        if (!dateStr) {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(part)) {
            const [d, m, y] = part.split('/');
            dateStr = `${y}-${m}-${d}`;
            continue;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
            dateStr = part;
            continue;
          }
        }

        // Amount match
        const cleanedAmt = part.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanedAmt);
        if (!isNaN(parsed) && /[0-9]/.test(part)) {
          amtNum = parsed;
          continue;
        }

        // Description
        if (part.length > 2 && !desc) {
          desc = part;
        }
      }

      if (dateStr && desc && amtNum !== 0) {
        const isCredit = amtNum > 0;
        transactions.push({
          id: 'csv_' + Date.now() + '_' + i,
          accountId: '',
          bankName,
          description: desc,
          amount: Math.round(Math.abs(amtNum) * 100) / 100,
          date: dateStr,
          category: this.categorizeDescription(desc),
          type: isCredit ? 'CREDIT' : 'DEBIT',
          status: 'POSTED',
          imported: false,
          userId
        });
        balance += amtNum;
      }
    }

    return {
      bankName,
      accountNumber: 'Extrato Importado',
      balance: Math.round(balance * 100) / 100,
      transactions
    };
  }

  /**
   * Helper to categorize transaction descriptions
   */
  private static categorizeDescription(desc: string): string {
    const d = desc.toLowerCase();
    if (d.includes('salario') || d.includes('salário') || d.includes('remunera') || d.includes('ted recebida') || d.includes('pix recebido')) return 'Salário';
    if (d.includes('mercado') || d.includes('supermercado') || d.includes('pao de acucar') || d.includes('carrefour') || d.includes('ifood') || d.includes('restaurante') || d.includes('padaria') || d.includes('lanchonete')) return 'Alimentação';
    if (d.includes('uber') || d.includes('posto') || d.includes('gasolina') || d.includes('combustivel') || d.includes('estacionamento') || d.includes('pedagio')) return 'Transporte';
    if (d.includes('farmacia') || d.includes('drogaria') || d.includes('hospital') || d.includes('medico') || d.includes('consulta')) return 'Saúde';
    if (d.includes('netflix') || d.includes('spotify') || d.includes('cinema') || d.includes('jogos') || d.includes('steam')) return 'Lazer';
    if (d.includes('luz') || d.includes('energia') || d.includes('agua') || d.includes('condominio') || d.includes('aluguel') || d.includes('internet')) return 'Moradia';
    if (d.includes('fatura') || d.includes('cartao') || d.includes('cartão')) return 'Cartão de Crédito';
    if (d.includes('rendimento') || d.includes('cdb') || d.includes('tesouro') || d.includes('dividendos') || d.includes('investimento')) return 'Investimento';
    return 'Bancário';
  }
}
