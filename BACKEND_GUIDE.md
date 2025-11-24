# Guia de Desenvolvimento do Backend - FinDash

Este guia descreve como configurar e desenvolver o backend para o sistema FinDash, utilizando a stack recomendada: **Node.js, Express, TypeScript e Prisma (PostgreSQL)**.

## 1. Estrutura Recomendada
O backend deve ser um projeto separado do frontend (outro repositório ou uma pasta `server/` fora da pasta do frontend).

## 2. Tecnologias
*   **Runtime:** Node.js
*   **Linguagem:** TypeScript
*   **Framework:** Express.js
*   **Banco de Dados:** PostgreSQL
*   **ORM:** Prisma (Facilita muito a manipulação do banco)
*   **Autenticação:** JSON Web Token (JWT) + bcrypt (para hash de senhas)

## 3. Passo a Passo Inicial

### 3.1. Iniciar o Projeto
Em uma nova pasta (ex: `findash-api`):
```bash
npm init -y
npm install express cors dotenv jsonwebtoken bcryptjs
npm install -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs ts-node nodemon prisma
npx tsc --init
```

### 3.2. Configurar o Banco de Dados (Prisma)
1. Inicialize o Prisma:
```bash
npx prisma init
```
2. No arquivo `.env` criado, coloque a URL do seu banco de dados (PostgreSQL local ou na nuvem, ex: Render/Neon/Supabase):
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/findash?schema=public"
JWT_SECRET="sua_chave_super_secreta_aqui"
```

3. No arquivo `prisma/schema.prisma`, defina as tabelas conforme o contrato do frontend:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  avatar    String?  // Base64 ou URL
  createdAt DateTime @default(now())

  transactions PersonalTransaction[]
  investments  Investment[]
}

model PersonalTransaction {
  id          String   @id @default(uuid())
  description String
  amount      Float
  date        DateTime
  type        String   // "Receita" | "Despesa"
  category    String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
}

model Investment {
  id            String   @id @default(uuid())
  name          String
  initialAmount Float
  currentValue  Float
  yieldRate     Float
  userId        String
  user          User     @relation(fields: [userId], references: [id])
}
```

4. Execute a migração para criar as tabelas no banco:
```bash
npx prisma migrate dev --name init
```

### 3.3. Criar o Servidor (`src/server.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const prisma = new PrismaClient();
const PORT = 3333;

app.use(express.json());
app.use(cors()); // Permite que o frontend acesse o backend

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token required' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.userId = (decoded as any).id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1d' });

  // Remover senha do retorno
  const { password: _, ...userWithoutPassword } = user;

  return res.json({ user: userWithoutPassword, token });
});

// Criar Usuário
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;
  
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) return res.status(409).json({ message: 'Email already in use' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword }
  });

  return res.status(201).json(user);
});


// --- ROTAS DE TRANSAÇÕES (Protegidas) ---

app.get('/api/transactions', authenticate, async (req: any, res) => {
  const transactions = await prisma.personalTransaction.findMany({
    where: { userId: req.userId },
    orderBy: { date: 'desc' }
  });
  return res.json(transactions);
});

app.post('/api/transactions', authenticate, async (req: any, res) => {
  const { description, amount, date, type, category } = req.body;

  const transaction = await prisma.personalTransaction.create({
    data: {
      description,
      amount,
      date: new Date(date), // Converter string para Date
      type,
      category,
      userId: req.userId
    }
  });

  return res.status(201).json(transaction);
});

// --- ROTAS DE INVESTIMENTOS (Protegidas) ---

app.get('/api/investments', authenticate, async (req: any, res) => {
  const investments = await prisma.investment.findMany({
    where: { userId: req.userId }
  });
  return res.json(investments);
});

app.post('/api/investments', authenticate, async (req: any, res) => {
  const { name, initialAmount, currentValue, yieldRate } = req.body;

  // 1. Cria o investimento
  const investment = await prisma.investment.create({
    data: {
      name,
      initialAmount,
      currentValue,
      yieldRate,
      userId: req.userId
    }
  });

  // 2. Opcional: Criar a transação de despesa automaticamente (Regra de Negócio)
  await prisma.personalTransaction.create({
    data: {
      description: `Aplicação: ${name}`,
      amount: initialAmount,
      date: new Date(),
      type: 'Despesa',
      category: 'Investimentos',
      userId: req.userId
    }
  });

  return res.status(201).json(investment);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## 4. Hospedagem do Backend
O Frontend (React) deve ser hospedado no **Netlify**.
O Backend (Node.js) deve ser hospedado em serviços como:
1.  **Render.com** (Tem plano gratuito para Web Services).
2.  **Railway.app** (Muito fácil de usar).
3.  **Fly.io**.

Após hospedar o backend, pegue a URL gerada (ex: `https://findash-api.onrender.com`) e configure no frontend.
