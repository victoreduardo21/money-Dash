
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
    } else if (route === 'users') {
      // Rota para listar usuários (Painel Admin - SaaS)
      data = getAllUsers();
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
    // Leitura robusta do corpo da requisição
    if (e.postData && e.postData.contents) {
      requestBody = JSON.parse(e.postData.contents);
    } else if (e.postData && e.postData.type === "application/json") {
       requestBody = JSON.parse(e.postData.getDataAsString());
    }
  } catch (err) {
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
    } else if (route === 'transactions/delete') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = deleteTransaction(requestBody.id, userEmail);
    } else if (route === 'investments') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = createInvestment(requestBody, userEmail);
    } else if (route === 'investments/delete') {
      const userEmail = getUserEmailFromToken(e, requestBody);
      data = deleteInvestment(requestBody.id, userEmail);
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
    // Validação de email e senha
    if (String(row[2]).trim() == String(body.email).trim() && String(row[3]).trim() == String(body.password).trim()) { 
      return {
        token: Utilities.base64Encode(body.email),
        user: {
          name: row[1],
          email: row[2],
          avatar: row[4],
          phone: row[5], // Coluna F
          cpf: row[6]    // Coluna G
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
  
  // Verifica se email já existe
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).trim() == String(body.email).trim()) {
      throw new Error("Email já cadastrado.");
    }
  }
  
  const newId = Utilities.getUuid();
  // ORDEM DAS COLUNAS: id, name, email, password, avatar, phone, cpf
  sheet.appendRow([
    newId, 
    body.name, 
    body.email, 
    body.password, 
    "", // Avatar inicia vazio
    body.phone || "", // Garante string vazia se não vier
    body.cpf || ""    // Garante string vazia se não vier
  ]);
  
  return { 
    id: newId, 
    name: body.name, 
    email: body.email 
  };
}

function getAllUsers() {
  const sheet = getSpreadsheet().getSheetByName('Users');
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  let users = [];
  
  // Pula cabeçalho
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    users.push({
      id: row[0],
      name: row[1],
      email: row[2],
      // Não enviamos senha nem avatar para a lista leve
      phone: row[5],
      cpf: row[6]
    });
  }
  return users;
}

function getTransactions(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  let transactions = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
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

function deleteTransaction(id, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) throw new Error("Aba 'Transactions' não encontrada.");
  
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0]) == String(id) && row[6] == userEmail) {
      sheet.deleteRow(i + 1); 
      return { success: true, message: "Transação excluída." };
    }
  }
  throw new Error("Transação não encontrada ou sem permissão.");
}

function getInvestments(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Investments');
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  let investments = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
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
  
  createTransaction({
    description: `Aplicação: ${body.name}`,
    amount: body.initialAmount,
    date: new Date().toISOString().split('T')[0],
    type: 'Despesa',
    category: 'Investimentos'
  }, userEmail);
  
  return body;
}

function deleteInvestment(id, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Investments');
  if (!sheet) throw new Error("Aba 'Investments' não encontrada.");
  
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0]) == String(id) && row[5] == userEmail) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Investimento excluído." };
    }
  }
  throw new Error("Investimento não encontrado ou sem permissão.");
}

function updatePassword(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == userEmail) {
       if (data[i][3] != body.currentPassword) {
         throw new Error("Senha atual incorreta.");
       }
       // Atualiza a senha (Coluna index 4 na função getRange = Coluna D)
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
       try {
         // Atualiza avatar (Coluna index 5 na função getRange = Coluna E)
         sheet.getRange(i + 1, 5).setValue(body.avatar);
       } catch(e) {
         throw new Error("Imagem muito grande para a planilha.");
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
    const decoded = Utilities.base64Decode(token);
    return Utilities.newBlob(decoded).getDataAsString();
  } catch (e) {
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
