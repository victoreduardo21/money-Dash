# Money Dashs - Dashboard Financeiro Pessoal

Bem-vindo ao repositório do **Money Dashs**, uma aplicação moderna de gestão financeira pessoal desenvolvida com React, TypeScript e TailwindCSS.

Este projeto é o **Frontend** da aplicação. Ele foi estruturado para ser conectado a uma API Backend.

---

## 📚 Documentação para Desenvolvedores

Se você é o desenvolvedor responsável pelo Backend ou pela integração, consulte os arquivos abaixo localizados na raiz deste projeto:

### 1. 📜 Contrato de API (`API_CONTRACT.md`)
Este documento define exatamente como o Frontend espera receber e enviar dados. Ele contém:
*   Estrutura dos objetos JSON (Usuários, Transações, Investimentos).
*   Endpoints (Rotas) que precisam ser criados.
*   Exemplos de requisições `GET`, `POST`, `PUT`, `DELETE`.

### 2. 🛠 Guia de Implementação do Backend (`BACKEND_GUIDE.md`)
Um guia passo a passo sugerido para criar o servidor utilizando:
*   **Node.js** com TypeScript.
*   **Express** para a API.
*   **Prisma & PostgreSQL** para o banco de dados.

---

## 🚀 Como rodar este projeto (Frontend)

Este projeto utiliza **Vite** para um ambiente de desenvolvimento rápido.

### Pré-requisitos
*   Node.js (versão 18 ou superior)

### Instalação

1.  Clone o repositório ou baixe os arquivos.
2.  Instale as dependências:
    ```bash
    npm install
    ```

### Rodando localmente

Para iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
O app estará disponível em `http://localhost:5173`.

### Build para Produção (Netlify/Vercel)

Para gerar os arquivos estáticos para deploy:
```bash
npm run build
```
Os arquivos gerados estarão na pasta `dist/`.

---

## 📁 Estrutura de Pastas Importantes

*   `src/components`: Componentes reutilizáveis (Header, Sidebar, Tabelas, Modais).
*   `src/pages`: As telas principais (Dashboard, Transações, Investimentos).
*   `src/types.ts`: Definições de tipos TypeScript (interfaces).
*   `src/services/api.ts`: Arquivo preparado para centralizar as chamadas HTTP para o backend.

---

## © Direitos Autorais

Desenvolvido por **GTS - Global Tech Software**.
Todos os direitos reservados.