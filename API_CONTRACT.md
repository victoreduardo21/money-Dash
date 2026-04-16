# Contrato de API - Money Dashs

Este documento define a interface de comunicação entre o Frontend (React) e o Backend.
O Backend deve expor uma API RESTful seguindo as especificações abaixo.

## Informações Globais

- **Base URL:** `https://api.seudominio.com/v1` (Sugestão)
- **Content-Type:** `application/json`
- **Autenticação:** Todas as rotas (exceto `/auth/*`) exigem o header:
  `Authorization: Bearer <token_jwt>`

---

## 1. Autenticação

### Login
Retorna o token de acesso e os dados do usuário.

- **Método:** `POST`
- **Endpoint:** `/auth/login`

**Exemplo de Requisição (Frontend):**
```javascript
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "usuario@email.com",
    password: "password123"
  })
});
```

**Response (200 OK):**
```json
{
  "token": "eyJhGcioJiusYzI1NiIsInR...",
  "user": {
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "avatar": "data:image/png;base64,..."
  }
}
```

---

## 2. Transações (Transactions)

### Listar Transações
Retorna a lista de transações do usuário logado.

- **Método:** `GET`
- **Endpoint:** `/transactions`
- **Header:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  {
    "id": "uuid-1234",
    "description": "Supermercado",
    "amount": 450.50,
    "date": "2024-05-20",
    "type": "Despesa",
    "category": "Alimentação"
  }
]
```

### Criar Transação
- **Método:** `POST`
- **Endpoint:** `/transactions`

**Body:**
```json
{
  "description": "Conta de Luz",
  "amount": 120.00,
  "date": "2024-05-21",
  "type": "Despesa",
  "category": "Moradia"
}
```

---

## 3. Investimentos

### Listar Investimentos
- **Método:** `GET`
- **Endpoint:** `/investments`

**Response (200 OK):**
```json
[
  {
    "id": "inv-001",
    "name": "Tesouro Selic",
    "initialAmount": 1000.00,
    "currentValue": 1050.30,
    "yieldRate": 100
  }
]
```

### Criar Investimento
**Nota para o Backend:** Ao criar um investimento, o sistema deve idealmente debitar o valor do saldo do usuário (criando uma transação de despesa interna), se for essa a regra de negócio desejada.

- **Método:** `POST`
- **Endpoint:** `/investments`

**Body:**
```json
{
  "name": "CDB Banco X",
  "initialAmount": 5000.00,
  "currentValue": 5000.00,
  "yieldRate": 110
}
```

---

## 4. Usuário

### Atualizar Senha
- **Método:** `PUT`
- **Endpoint:** `/users/me/password`

**Body:**
```json
{
  "currentPassword": "123",
  "newPassword": "456"
}
```

### Atualizar Avatar
- **Método:** `PUT`
- **Endpoint:** `/users/me/avatar`

**Body:**
```json
{
  "avatar": "base64_string..."
}
```
