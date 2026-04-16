
# Configuração da Planilha Google (Banco de Dados)

Para que o sistema Money Dashs funcione corretamente, configure sua Planilha Google conforme as tabelas abaixo.

### 1. Aba: `Users`
**Atenção:** A ordem das colunas deve ser exata.
**Formatação:** Selecione as colunas `phone` (F), `cpf` (G) e `status` (H) e vá em **Formatar > Número > Texto Simples**.

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID único do usuário |
| **B** | `name` | Nome completo |
| **C** | `email` | E-mail (Login) |
| **D** | `password` | Senha |
| **E** | `avatar` | Foto (Base64) |
| **F** | `phone` | Telefone |
| **G** | `cpf` | CPF |
| **H** | `status` | Status Assinatura (`PENDING` ou `ACTIVE`) |
| **I** | `plan` | Plano (`FREE`, `PRO`, `VIP`) |
| **J** | `billingCycle`| Ciclo de faturamento (`MONTHLY`, `ANNUAL`) |

---

### 2. Aba: `Transactions`

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID da transação |
| **B** | `description` | Descrição |
| **C** | `amount` | Valor |
| **D** | `date` | Data (YYYY-MM-DD) - **Formatar como Texto Simples** |
| **E** | `type` | Receita ou Despesa |
| **F** | `category` | Categoria |
| **G** | `currency` | Moeda (`BRL`, `USD`) |
| **H** | `userEmail` | Dono da transação |

---

### 3. Aba: `Investments`

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID do investimento |
| **B** | `name` | Nome do ativo |
| **C** | `initialAmount` | Valor investido |
| **D** | `currentValue` | Valor atual |
| **E** | `yieldRate` | Taxa de rendimento |
| **F** | `currency` | Moeda (`BRL`, `USD`) |
| **G** | `userEmail` | Dono do investimento |

---

### 4. Aba: `Calendar` (Antigo Tasks)
Crie uma nova aba chamada `Calendar` para a Agenda.

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID do evento/tarefa |
| **B** | `description` | O que fazer |
| **C** | `date` | Data (YYYY-MM-DD) |
| **D** | `done` | Concluído (TRUE/FALSE) |
| **E** | `userEmail` | Dono do evento |
