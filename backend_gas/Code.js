
// ============================================================================
// BACKEND DO FINDASH - GOOGLE APPS SCRIPT (MULTILANGUAGE & MULTICURRENCY)
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
    if (route === 'auth/login') {
      data = loginUser(requestBody);
    } else if (route === 'users') {
      data = createUser(requestBody);
    } else if (route === 'transactions') {
      const userEmail = getUserEmailFromToken(e, requestBody); 
      data = createTransaction(requestBody, userEmail);
    } else if (route === 'transactions/delete') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = deleteTransaction(requestBody.id, userEmail);
    } else if (route === 'investments') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = createInvestment(requestBody, userEmail);
    } else if (route === 'investments/delete') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = deleteInvestment(requestBody.id, userEmail);
    } else if (route === 'users/me/language') { // NOVA ROTA
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = updateUserLanguage(requestBody.language, userEmail);
    } else if (route === 'users/me/password') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = updatePassword(requestBody, userEmail);
    } else if (route === 'users/me/plan') { 
       const userEmail = getUserEmailFromToken(e, requestBody);
       data = updateUserPlan(requestBody, userEmail);
    } else {
      return responseError('Rota não encontrada.', 404);
    }
    return responseJSON(data);
  } catch (error) {
    return responseError(error.toString());
  }
}

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
          name: row[1],
          email: row[2],
          avatar: row[4], 
          subscriptionStatus: row[7] || 'PENDING',
          plan: row[8] || 'FREE', 
          billingCycle: row[9] || 'MONTHLY',
          language: row[10] || 'pt-BR' // Coluna K (Índice 10)
        }
      };
    }
  }
  throw new Error("Email ou senha inválidos.");
}

function getUserProfile(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const targetEmail = String(userEmail).trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2]).trim().toLowerCase() == targetEmail) {
      return {
          name: row[1],
          email: row[2],
          subscriptionStatus: row[7] || 'PENDING',
          plan: row[8] || 'FREE',
          billingCycle: row[9] || 'MONTHLY',
          language: row[10] || 'pt-BR'
      };
    }
  }
  throw new Error("Usuário não encontrado.");
}

function updateUserLanguage(lang, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const targetEmail = String(userEmail).trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim().toLowerCase() == targetEmail) {
       sheet.getRange(i + 1, 11).setValue(lang); // Coluna K
       return { success: true, language: lang };
    }
  }
  return { success: false };
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

function createTransaction(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const newId = "TRX" + new Date().getTime();
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
  return body;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function responseError(message, code) {
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
