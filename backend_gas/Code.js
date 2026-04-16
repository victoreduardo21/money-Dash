
// ============================================================================
// BACKEND DO MONEY DASHS - GOOGLE APPS SCRIPT
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

    // MAPEAMENTO DE ROTAS
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
    } else if (route === 'users/me/password') {
      data = updatePassword(requestBody, userEmail);
    } else if (route === 'users/me/avatar') {
      data = updateAvatar(requestBody, userEmail);
    } else if (route === 'users/me/status') {
      data = toggleUserStatus(requestBody, userEmail);
    }

    return responseJSON(data);
  } catch (error) {
    return responseError(error.toString());
  }
}

// --- FUNÇÕES DE BUSCA (GET) ---

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
        id: row[0], description: row[1], amount: Number(row[2]),
        date: formatDate(row[3]), type: row[4], category: row[5], currency: row[6] || 'BRL'
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
        id: rows[i][0], name: rows[i][1], initialAmount: Number(rows[i][2]),
        currentValue: Number(rows[i][3]), yieldRate: Number(rows[i][4]), currency: rows[i][5] || 'BRL'
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
      events.push({ id: rows[i][0], description: rows[i][1], date: formatDate(rows[i][2]), done: !!rows[i][3] });
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
        name: rows[i][1], email: rows[i][2], plan: rows[i][8] || 'FREE',
        subscriptionStatus: rows[i][7] || 'PENDING', language: rows[i][10] || 'pt-BR'
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
    users.push({ id: rows[i][0], name: rows[i][1], email: rows[i][2], subscriptionStatus: rows[i][7], plan: rows[i][8] });
  }
  return users;
}

// --- FUNÇÕES DE ESCRITA (POST) ---

function loginUser(body) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const email = String(body.email).trim().toLowerCase();
  const password = String(body.password).trim();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email && String(rows[i][3]) === password) {
      return {
        token: Utilities.base64Encode(email),
        user: { name: rows[i][1], email: rows[i][2], plan: rows[i][8] || 'FREE', subscriptionStatus: rows[i][7] || 'PENDING', language: rows[i][10] || 'pt-BR' }
      };
    }
  }
  throw new Error("Usuário ou senha inválidos.");
}

function createUser(body) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const email = String(body.email).trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email) throw new Error("E-mail já cadastrado.");
  }
  const newId = "USR" + new Date().getTime();
  sheet.appendRow([newId, body.name, email, body.password, "", body.phone || "", body.cpf || "", "PENDING", body.plan || "FREE", body.billingCycle || "MONTHLY", "pt-BR"]);
  return { success: true, id: newId };
}

function saveTransaction(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const rows = sheet.getDataRange().getValues();
  if (body.id) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(body.id)) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[body.description, body.amount, body.date, body.type, body.category, body.currency || 'BRL']]);
        return { success: true };
      }
    }
  }
  sheet.appendRow(["TRX" + new Date().getTime(), body.description, body.amount, body.date, body.type, body.category, body.currency || 'BRL', userEmail]);
  return { success: true };
}

function deleteTransaction(id, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error("Transação não encontrada.");
}

function createInvestment(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Investments');
  const rows = sheet.getDataRange().getValues();
  
  // Se for edição
  if (body.id) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(body.id)) {
        sheet.getRange(i + 1, 2, 1, 5).setValues([[body.name, body.initialAmount, body.currentValue, body.yieldRate, body.currency || 'BRL']]);
        return { success: true };
      }
    }
  }
  
  // Se for NOVO investimento
  const newInvId = "INV" + new Date().getTime();
  sheet.appendRow([newInvId, body.name, body.initialAmount, body.currentValue, body.yieldRate, body.currency || 'BRL', userEmail]);
  
  // --- ATUALIZAÇÃO AUTOMÁTICA DO SALDO ---
  // Gera uma transação de DESPESA para tirar o dinheiro do saldo disponível
  saveTransaction({
    description: "Aplicação: " + body.name,
    amount: body.initialAmount,
    date: formatDate(new Date()),
    type: "Despesa",
    category: "Investimentos",
    currency: body.currency || 'BRL'
  }, userEmail);

  return { success: true };
}

function deleteInvestment(id, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Investments');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error("Investimento não encontrado.");
}

function withdrawInvestment(id, userEmail) {
  const invSheet = getSpreadsheet().getSheetByName('Investments');
  const rows = invSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const inv = rows[i];
      invSheet.deleteRow(i + 1);
      
      // Ao resgatar, gera uma RECEITA para colocar o dinheiro de volta no saldo
      saveTransaction({ 
        description: "Resgate: " + inv[1], 
        amount: inv[3], // Valor atual/final
        date: formatDate(new Date()), 
        type: "Receita", 
        category: "Investimentos", 
        currency: inv[5] 
      }, userEmail);
      
      return { success: true };
    }
  }
  throw new Error("Ativo não encontrado.");
}

function saveCalendarEvent(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Calendar');
  sheet.appendRow(["CAL" + new Date().getTime(), body.description, body.date, false, userEmail]);
  return { success: true };
}

function toggleCalendarEvent(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Calendar');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.id)) { sheet.getRange(i + 1, 4).setValue(body.done); return { success: true }; }
  }
  return { success: false };
}

function deleteCalendarEvent(id, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Calendar');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}

function updateUserLanguage(lang, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === userEmail.toLowerCase()) { sheet.getRange(i + 1, 11).setValue(lang); return { success: true }; }
  }
  return { success: false };
}

function updateUserPlan(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === userEmail.toLowerCase()) {
      sheet.getRange(i + 1, 9, 1, 2).setValues([[body.plan, body.billingCycle]]);
      return { success: true };
    }
  }
  return { success: false };
}

function updatePassword(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === userEmail.toLowerCase()) {
      if (String(rows[i][3]) !== body.currentPassword) throw new Error("Senha atual incorreta.");
      sheet.getRange(i + 1, 4).setValue(body.newPassword);
      return { success: true };
    }
  }
  return { success: false };
}

function updateAvatar(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === userEmail.toLowerCase()) { sheet.getRange(i + 1, 5).setValue(body.avatar); return { success: true }; }
  }
  return { success: false };
}

function toggleUserStatus(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === body.targetEmail.toLowerCase()) { sheet.getRange(i + 1, 8).setValue(body.status); return { success: true }; }
  }
  return { success: false };
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
