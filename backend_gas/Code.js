
// ============================================================================
// BACKEND DO FINDASH - GOOGLE APPS SCRIPT
// ============================================================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * GET - Roteamento principal para leitura de dados
 */
function doGet(e) {
  const route = e.parameter.route;
  const token = e.parameter.token;
  
  try {
    if (!token && route !== 'auth/login') return responseError("Token obrigatório", 401);
    
    let data = [];
    if (route === 'transactions') {
      data = getTransactions(token);
    } else if (route === 'investments') {
      data = getInvestments(token);
    } else if (route === 'calendar') { 
      data = getCalendarEvents(token);
    } else if (route === 'users/me') {
      data = getUserProfile(token);
    } else if (route === 'users') {
      data = getAllUsers();
    }
    return responseJSON(data);
  } catch (error) {
    return responseError(error.toString());
  }
}

/**
 * POST - Roteamento principal para escrita de dados
 */
function doPost(e) {
  let requestBody = {};
  try {
    if (e.postData && e.postData.contents) {
      requestBody = JSON.parse(e.postData.contents);
    }
  } catch (err) { requestBody = {}; }

  const route = e.parameter.route;
  
  try {
    // Rotas Públicas (Não precisam de Token)
    if (route === 'auth/login') {
      return responseJSON(loginUser(requestBody));
    }
    if (route === 'users' && !requestBody.token) {
      return responseJSON(createUser(requestBody));
    }

    // Rotas Privadas (Exigem Token)
    const userEmail = getUserEmailFromToken(e, requestBody);
    if (!userEmail) return responseError("Sessão expirada", 401);

    let data = { success: false };

    if (route === 'transactions') {
      data = saveTransaction(requestBody, userEmail);
    } else if (route === 'transactions/delete') {
      data = deleteTransaction(requestBody.id, userEmail);
    } else if (route === 'investments') {
      data = createInvestment(requestBody, userEmail);
    } else if (route === 'investments/delete') {
      data = deleteInvestment(requestBody.id, userEmail);
    } else if (route === 'investments/withdraw') {
      data = withdrawInvestment(requestBody.id, userEmail);
    } else if (route === 'calendar') {
      data = saveCalendarEvent(requestBody, userEmail);
    } else if (route === 'calendar/toggle') {
      data = toggleCalendarEvent(requestBody, userEmail);
    } else if (route === 'calendar/delete') {
      data = deleteCalendarEvent(requestBody.id, userEmail);
    } else if (route === 'users/me/language') {
      data = updateUserLanguage(requestBody.language, userEmail);
    } else if (route === 'users/me/plan') { 
      data = updateUserPlan(requestBody, userEmail);
    }

    return responseJSON(data);
  } catch (error) {
    return responseError(error.toString());
  }
}

// --- FUNÇÕES DE BUSCA ---

function getTransactions(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  let transactions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[7]).toLowerCase() === userEmail.toLowerCase()) {
      transactions.push({
        id: row[0],
        description: row[1],
        amount: Number(row[2]),
        date: formatDate(row[3]), 
        type: row[4],
        category: row[5],
        currency: row[6] || 'BRL'
      });
    }
  }
  return transactions.reverse();
}

function getInvestments(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Investments');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  let investments = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][6]).toLowerCase() === userEmail.toLowerCase()) {
      investments.push({
        id: rows[i][0],
        name: rows[i][1],
        initialAmount: Number(rows[i][2]),
        currentValue: Number(rows[i][3]),
        yieldRate: Number(rows[i][4]),
        currency: rows[i][5] || 'BRL'
      });
    }
  }
  return investments;
}

function getCalendarEvents(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Calendar');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  let events = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][4]).toLowerCase() === userEmail.toLowerCase()) {
      events.push({
        id: rows[i][0],
        description: rows[i][1],
        date: formatDate(rows[i][2]),
        done: !!rows[i][3]
      });
    }
  }
  return events;
}

function getUserProfile(encodedEmail) {
  const email = decodeToken(encodedEmail).toLowerCase();
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email) {
      return {
        name: rows[i][1],
        email: rows[i][2],
        plan: rows[i][8] || 'FREE',
        subscriptionStatus: rows[i][7] || 'PENDING',
        language: rows[i][10] || 'pt-BR'
      };
    }
  }
  return null;
}

function getAllUsers() {
  const sheet = getSpreadsheet().getSheetByName('Users');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  let users = [];
  for (let i = 1; i < rows.length; i++) {
    users.push({
      id: rows[i][0],
      name: rows[i][1],
      email: rows[i][2],
      subscriptionStatus: rows[i][7],
      plan: rows[i][8]
    });
  }
  return users;
}

// --- FUNÇÕES DE ESCRITA ---

function loginUser(body) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const email = String(body.email).trim().toLowerCase();
  const password = String(body.password).trim();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email && String(rows[i][3]) === password) {
      return {
        token: Utilities.base64Encode(email),
        user: {
          name: rows[i][1],
          email: rows[i][2],
          plan: rows[i][8] || 'FREE',
          subscriptionStatus: rows[i][7] || 'PENDING',
          language: rows[i][10] || 'pt-BR'
        }
      };
    }
  }
  throw new Error("Usuário ou senha inválidos.");
}

function saveTransaction(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const rows = sheet.getDataRange().getValues();
  const transactionId = body.id;

  if (transactionId) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(transactionId)) {
        const rowNum = i + 1;
        sheet.getRange(rowNum, 2, 1, 6).setValues([[
          body.description,
          body.amount,
          body.date,
          body.type,
          body.category,
          body.currency || 'BRL'
        ]]);
        return { success: true, id: transactionId };
      }
    }
  }

  const newId = "TRX" + new Date().getTime();
  sheet.appendRow([newId, body.description, body.amount, body.date, body.type, body.category, body.currency || 'BRL', userEmail]);
  return { success: true, id: newId };
}

function withdrawInvestment(id, userEmail) {
  const invSheet = getSpreadsheet().getSheetByName('Investments');
  const invRows = invSheet.getDataRange().getValues();
  
  for (let i = 1; i < invRows.length; i++) {
    if (String(invRows[i][0]) === String(id)) {
      const name = invRows[i][1];
      const amount = invRows[i][3]; 
      const currency = invRows[i][5] || 'BRL';
      
      invSheet.deleteRow(i + 1);
      
      const txSheet = getSpreadsheet().getSheetByName('Transactions');
      txSheet.appendRow([
        "WDR" + new Date().getTime(),
        "Resgate: " + name,
        amount,
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        "Receita",
        "Investimentos",
        currency,
        userEmail
      ]);
      return { success: true };
    }
  }
  throw new Error("Ativo não encontrado.");
}

// --- UTILITÁRIOS ---

function decodeToken(token) {
  try {
    const decoded = Utilities.base64Decode(token);
    return Utilities.newBlob(decoded).getDataAsString();
  } catch (e) { return token; }
}

function getUserEmailFromToken(e, body) {
  let token = e.parameter.token || (body && body.token);
  if (!token) return null;
  return decodeToken(token);
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  try { return Utilities.formatDate(new Date(dateObj), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
  catch(e) { return String(dateObj); }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function responseError(msg, code = 500) {
  return ContentService.createTextOutput(JSON.stringify({ error: true, message: msg, code: code })).setMimeType(ContentService.MimeType.JSON);
}
