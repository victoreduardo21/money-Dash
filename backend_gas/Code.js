
// ============================================================================
// BACKEND DO FINDASH - GOOGLE APPS SCRIPT (FIX: DUPLICIDADE E LOGICA DE CAMBIO)
// ============================================================================

const ASAAS_API_KEY = '$aact_...'; 
const ASAAS_URL = 'https://www.asaas.com/api/v3'; 

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const route = e.parameter.route;
  const token = e.parameter.token;
  let data = {};
  
  try {
    if (route === 'transactions') {
      data = getTransactions(token);
    } else if (route === 'investments') {
      data = getInvestments(token);
    } else if (route === 'calendar') { 
      data = getCalendarEvents(token);
    } else if (route === 'users') {
      data = getAllUsers();
    } else if (route === 'users/me') {
      data = getUserProfile(token);
    } else {
      return responseJSON([]); 
    }
    return responseJSON(data);
  } catch (error) {
    return responseError(error.toString());
  }
}

function doPost(e) {
  let requestBody = {};
  try {
    if (e.postData && e.postData.contents) {
      requestBody = JSON.parse(e.postData.contents);
    }
  } catch (err) { requestBody = {}; }

  const route = e.parameter.route;
  let data = {};

  try {
    const userEmail = getUserEmailFromToken(e, requestBody);

    if (route === 'auth/login') {
      data = loginUser(requestBody);
    } else if (route === 'transactions') {
      data = saveTransaction(requestBody, userEmail);
    } else if (route === 'transactions/delete') {
      data = deleteTransaction(requestBody.id, userEmail);
    } else if (route === 'investments') {
      data = createInvestment(requestBody, userEmail);
    } else if (route === 'investments/delete') {
      data = deleteInvestment(requestBody.id, userEmail);
    } else if (route === 'users/me/language') {
      data = updateUserLanguage(requestBody.language, userEmail);
    } else if (route === 'users/me/password') {
      data = updatePassword(requestBody, userEmail);
    } else if (route === 'users/me/plan') { 
       data = updateUserPlan(requestBody, userEmail);
    } else {
      return responseError('Rota não encontrada.', 404);
    }
    return responseJSON(data);
  } catch (error) {
    return responseError(error.toString());
  }
}

/**
 * Salva ou Atualiza uma transação (Evita duplicação)
 */
function saveTransaction(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const rows = sheet.getDataRange().getValues();
  const transactionId = body.id;
  
  // Se tem ID, tenta encontrar para atualizar
  if (transactionId) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(transactionId) && String(rows[i][7]).toLowerCase() === userEmail.toLowerCase()) {
        const rowNum = i + 1;
        sheet.getRange(rowNum, 2).setValue(body.description);
        sheet.getRange(rowNum, 3).setValue(body.amount);
        sheet.getRange(rowNum, 4).setValue(body.date);
        sheet.getRange(rowNum, 5).setValue(body.type);
        sheet.getRange(rowNum, 6).setValue(body.category);
        sheet.getRange(rowNum, 7).setValue(body.currency || 'BRL');
        return { success: true, message: "Atualizado", id: transactionId };
      }
    }
  }

  // Se não tem ID ou não encontrou, cria novo
  const newId = transactionId || ("TRX" + new Date().getTime());
  sheet.appendRow([
    newId,
    body.description,
    body.amount,
    body.date,
    body.type,
    body.category,
    body.currency || 'BRL',
    userEmail
  ]);
  
  return { success: true, message: "Criado", id: newId };
}

function getTransactions(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  let transactions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[7]).toLowerCase() === String(userEmail).toLowerCase()) {
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

// Funções de apoio
function loginUser(body) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const targetEmail = String(body.email).trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2]).trim().toLowerCase() == targetEmail && String(row[3]).trim() == String(body.password).trim()) { 
      return {
        token: Utilities.base64Encode(body.email),
        user: {
          name: row[1], email: row[2], avatar: row[4], 
          subscriptionStatus: row[7] || 'PENDING', plan: row[8] || 'FREE', 
          billingCycle: row[9] || 'MONTHLY', language: row[10] || 'pt-BR'
        }
      };
    }
  }
  throw new Error("Email ou senha inválidos.");
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function responseError(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: true, message: message })).setMimeType(ContentService.MimeType.JSON);
}

function decodeToken(token) {
  try {
    const decoded = Utilities.base64Decode(token);
    return Utilities.newBlob(decoded).getDataAsString();
  } catch (e) { return token; }
}

function getUserEmailFromToken(e, body) {
  let token = e.parameter.token || (body && body.token);
  if (!token) throw new Error("Auth token missing.");
  return decodeToken(token);
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  try { return Utilities.formatDate(new Date(dateObj), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
  catch(e) { return String(dateObj); }
}

function deleteTransaction(id, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id) && String(rows[i][7]).toLowerCase() === userEmail.toLowerCase()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("Transação não encontrada.");
}
