
// ============================================================================
// BACKEND DO FINDASH - GOOGLE APPS SCRIPT
// Copie este código para o editor de script da sua planilha Google.
// ============================================================================

// ID da Planilha (Opcional se o script estiver vinculado à planilha, caso contrário preencha)
// const SPREADSHEET_ID = "SEU_ID_DA_PLANILHA_AQUI"; 

function getSpreadsheet() {
  // Se o script estiver "dentro" da planilha (Container-bound):
  return SpreadsheetApp.getActiveSpreadsheet();
  
  // Se o script for independente, descomente a linha abaixo e coloque o ID:
  // return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ============================================================================
// FUNÇÕES DE ROTAS (DO GET e DO POST)
// ============================================================================

function doGet(e) {
  const route = e.parameter.route;
  const token = e.parameter.token; // Vamos usar o email como "token" simples para este MVP

  let data = {};
  
  try {
    if (route === 'transactions') {
      data = getTransactions(token);
    } else if (route === 'investments') {
      data = getInvestments(token);
    } else {
      return responseError('Rota não encontrada (GET)', 404);
    }
    
    return responseJSON(data);
    
  } catch (error) {
    return responseError(error.toString());
  }
}

function doPost(e) {
  // O Apps Script recebe o corpo JSON em e.postData.contents
  let requestBody = {};
  
  try {
    if (e.postData && e.postData.contents) {
      requestBody = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return responseError("Erro ao ler JSON body: " + err.toString());
  }

  const route = e.parameter.route;
  let data = {};

  try {
    if (route === 'auth/login') {
      data = loginUser(requestBody);
    } else if (route === 'users') {
      data = createUser(requestBody);
    } else if (route === 'transactions') {
      // Verifica autenticação simples (email no header Authorization simulado ou body)
      const userEmail = getUserEmailFromToken(e); 
      data = createTransaction(requestBody, userEmail);
    } else if (route === 'investments') {
      const userEmail = getUserEmailFromToken(e);
      data = createInvestment(requestBody, userEmail);
    } else if (route === 'users/me/password') {
      const userEmail = getUserEmailFromToken(e);
      data = updatePassword(requestBody, userEmail);
    } else if (route === 'users/me/avatar') {
       const userEmail = getUserEmailFromToken(e);
       data = updateAvatar(requestBody, userEmail);
    } else {
      return responseError('Rota não encontrada (POST)', 404);
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
  const rows = sheet.getDataRange().getValues();
  // Cabeçalho: [id, name, email, password, avatar]
  
  // Pula o cabeçalho (i=1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[2] == body.email && row[3] == body.password) { // row[2] = email, row[3] = password
      return {
        token: Utilities.base64Encode(body.email), // Token simples (base64 do email) para o MVP
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
  const rows = sheet.getDataRange().getValues();
  
  // Verifica se email já existe
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2] == body.email) {
      throw new Error("Email já cadastrado.");
    }
  }
  
  const newId = Utilities.getUuid();
  // Ordem: id, name, email, password, avatar
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
  const rows = sheet.getDataRange().getValues();
  // Cabeçalho: [id, description, amount, date, type, category, userEmail]
  
  let transactions = [];
  
  // Começa do 1 para pular cabeçalho
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // row[6] é o email do dono da transação
    if (row[6] === userEmail) {
      transactions.push({
        id: row[0],
        description: row[1],
        amount: Number(row[2]),
        date: formatDate(row[3]), // Formata data do Google Sheets
        type: row[4],
        category: row[5]
      });
    }
  }
  
  // Ordenar por data (mais recente primeiro)
  return transactions.reverse();
}

function createTransaction(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const newId = "TRX" + new Date().getTime();
  
  // Ordem: [id, description, amount, date, type, category, userEmail]
  sheet.appendRow([
    newId,
    body.description,
    body.amount,
    body.date,
    body.type,
    body.category,
    userEmail
  ]);
  
  return body; // Retorna o que foi criado
}

function getInvestments(encodedEmail) {
  const userEmail = decodeToken(encodedEmail);
  const sheet = getSpreadsheet().getSheetByName('Investments');
  const rows = sheet.getDataRange().getValues();
  // Cabeçalho: [id, name, initialAmount, currentValue, yieldRate, userEmail]
  
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
  const newId = "INV" + new Date().getTime();
  
  // Ordem: [id, name, initialAmount, currentValue, yieldRate, userEmail]
  sheet.appendRow([
    newId,
    body.name,
    body.initialAmount,
    body.currentValue,
    body.yieldRate,
    userEmail
  ]);
  
  // Regra de negócio: Debitar do saldo (criar transação de despesa)
  // Reutiliza a função createTransaction
  createTransaction({
    description: `Aplicação: ${body.name}`,
    amount: body.initialAmount,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    type: 'Despesa',
    category: 'Investimentos'
  }, userEmail);
  
  return body;
}

function updatePassword(body, userEmail) {
  const sheet = getSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == userEmail) { // row[2] is email
       if (data[i][3] != body.currentPassword) {
         throw new Error("Senha atual incorreta.");
       }
       // Atualiza a célula D(i+1) -> Coluna 4 (Senha)
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
       // Atualiza a célula E(i+1) -> Coluna 5 (Avatar)
       // Nota: Células do Sheets tem limite de caracteres (50k). Avatars Base64 grandes podem falhar.
       sheet.getRange(i + 1, 5).setValue(body.avatar);
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

// Helper para pegar o token que vem na URL (GET) ou tentar extrair do Header (difícil no GAS puro sem wrapper)
// Para este MVP, vamos passar o token via query param (?token=...) ou via propriedade no body JSON
function getUserEmailFromToken(e) {
  let token = e.parameter.token; // Tenta pegar da URL
  
  // Se não tiver na URL, tenta pegar do body (se for POST)
  if (!token && e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      if (body.token) token = body.token;
    } catch(e) {}
  }

  if (!token) throw new Error("Token de autenticação não fornecido.");
  
  return decodeToken(token);
}

function decodeToken(token) {
  // Implementação simples: Token é apenas o email em Base64
  // Em produção, usar JWT Libraries seria o ideal, mas complexo para GAS puro.
  try {
    const decodedBytes = Utilities.base64Decode(token);
    return Utilities.newBlob(decodedBytes).getDataAsString();
  } catch (e) {
    throw new Error("Token inválido.");
  }
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  // Formata para YYYY-MM-DD
  return Utilities.formatDate(new Date(dateObj), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

/*
  COMO FAZER O DEPLOY:
  1. Clique em "Implantar" (Deploy) > "Nova implantação" (New deployment).
  2. Selecione o tipo "App da Web" (Web app).
  3. Descrição: "FinDash API v1".
  4. Executar como: "Eu" (Me).
  5. Quem pode acessar: "Qualquer pessoa" (Anyone).
  6. Clique em "Implantar".
  7. Copie a URL do App da Web gerada (termina em /exec).
*/
