
// ============================================================================
// BACKEND DO FINDASH - GOOGLE APPS SCRIPT
// Copie este código para o editor de script da sua planilha Google.
// IMPORTANTE: Ao salvar, vá em Implantar > Gerenciar Implantações > EDITAR > NOVA VERSÃO > Implantar.
// ============================================================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================================================
// FUNÇÕES DE ROTAS
// ============================================================================

function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
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
    } else {
      return responseJSON([]); // Retorna array vazio em vez de erro para não quebrar o front
    }
    
    return responseJSON(data);
    
  } catch (error) {
    return responseError(error.toString());
  }
}

function doPost(e) {
  let requestBody = {};
  
  try {
    // Tentativa robusta de ler o JSON, venha ele como stream ou parameter
    if (e.postData && e.postData.contents) {
      requestBody = JSON.parse(e.postData.contents);
    } else if (e.postData && e.postData.type === "application/json") {
       requestBody = JSON.parse(e.postData.getDataAsString());
    }
  } catch (err) {
    // Se falhar o parse, tenta assumir que é texto simples
    requestBody = {};
  }

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
    } else if (route === 'investments') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = createInvestment(requestBody, userEmail);
    } else if (route === 'users/me/password') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = updatePassword(requestBody, userEmail);
    } else if (route === 'users/me/avatar') {
       const userEmail = getUserEmailFromToken(e, requestBody);
       data = updateAvatar(requestBody, userEmail);
    } else {
      return responseError('Rota não encontrada (POST).', 404);
    }

    return responseJSON(data);

  } catch (error) {
    return responseError(error.toString());
  }
}

// ============================================================================
// LÓGICA DE NEGÓCIO
// ============================================================================

function loginUser(body) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  if (!sheet) throw new Error("Aba 'Users' não encontrada.");
  
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Comparação frouxa (==) para evitar erros de tipo
    if (String(row[2]).trim() == String(body.email).trim() && String(row[3]).trim() == String(body.password).trim()) { 
      return {
        token: Utilities.base64Encode(body.email),
        user: {
          name: row[1],
          email: row[2],
          avatar: row[4]
        }
      };
    }
  }
  throw new Error("Email ou senha inválidos.");
}

function createUser(body) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  if (!sheet) throw new Error("Aba 'Users' não encontrada.");
  
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).trim() == String(body.email).trim()) {
      throw new Error("Email já cadastrado.");
    }
  }
  
  const newId = Utilities.getUuid();
  // id, name, email, password, avatar
  sheet.appendRow([newId, body.name, body.email, body.password, ""]);
  
  return { 
    id: newId, 
    name: body.name, 
    email: body.email 
  };
}

function getTransactions(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  let transactions = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Coluna G (index 6) é o email
    if (row[6] === userEmail) {
      transactions.push({
        id: row[0],
        description: row[1],
        amount: Number(row[2]),
        date: formatDate(row[3]), 
        type: row[4],
        category: row[5]
      });
    }
  }
  return transactions.reverse();
}

function createTransaction(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) throw new Error("Aba 'Transactions' não encontrada.");

  const newId = "TRX" + new Date().getTime();
  
  // Limpeza da data
  let dateStr = body.date;
  if(dateStr && dateStr.includes('T')) dateStr = dateStr.split('T')[0];

  sheet.appendRow([
    newId,
    body.description,
    body.amount,
    dateStr,
    body.type,
    body.category,
    userEmail
  ]);
  
  return body;
}

function getInvestments(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Investments');
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  let investments = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Coluna F (index 5) é o email
    if (row[5] === userEmail) {
      investments.push({
        id: row[0],
        name: row[1],
        initialAmount: Number(row[2]),
        currentValue: Number(row[3]),
        yieldRate: Number(row[4])
      });
    }
  }
  return investments;
}

function createInvestment(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Investments');
  if (!sheet) throw new Error("Aba 'Investments' não encontrada.");

  const newId = "INV" + new Date().getTime();
  
  sheet.appendRow([
    newId,
    body.name,
    body.initialAmount,
    body.currentValue,
    body.yieldRate,
    userEmail
  ]);
  
  // Cria transação de despesa associada
  createTransaction({
    description: `Aplicação: ${body.name}`,
    amount: body.initialAmount,
    date: new Date().toISOString().split('T')[0],
    type: 'Despesa',
    category: 'Investimentos'
  }, userEmail);
  
  return body;
}

function updatePassword(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == userEmail) {
       if (data[i][3] != body.currentPassword) {
         throw new Error("Senha atual incorreta.");
       }
       // Coluna D (index 4 na lógica de getRange, mas index 3 no array base-0)
       sheet.getRange(i + 1, 4).setValue(body.newPassword);
       return { message: "Senha alterada com sucesso." };
    }
  }
  throw new Error("Usuário não encontrado.");
}

function updateAvatar(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == userEmail) {
       // Coluna E (index 5 no getRange)
       try {
         sheet.getRange(i + 1, 5).setValue(body.avatar);
       } catch(e) {
         throw new Error("A imagem é muito grande para a planilha. Tente uma menor.");
       }
       return { avatar: body.avatar };
    }
  }
  throw new Error("Usuário não encontrado.");
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function responseError(message, code) {
  const output = { error: true, message: message };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function getUserEmailFromToken(e, body) {
  let token = e.parameter.token;
  if (!token && body && body.token) token = body.token;
  if (!token) throw new Error("Token de autenticação não fornecido.");
  return decodeToken(token);
}

function decodeToken(token) {
  try {
    const decodedBytes = Utilities.base64Encode(token); // Errata: na vdd base64Decode. Mas o token já vem encoded do front.
    // O token é apenas o email em base64.
    const decoded = Utilities.base64Decode(token);
    return Utilities.newBlob(decoded).getDataAsString();
  } catch (e) {
    // Se der erro no decode, assume que o token já é o email (legado) ou tenta prosseguir
    return token;
  }
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  if (typeof dateObj === 'string' && dateObj.match(/^\d{4}-\d{2}-\d{2}$/)) return dateObj;
  
  try {
     return Utilities.formatDate(new Date(dateObj), Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch(e) {
     return String(dateObj);
  }
}
