
# Configuração da Planilha Google (Banco de Dados)

Para que o sistema FinDash funcione corretamente, configure sua Planilha Google conforme as tabelas abaixo.

### 1. Aba: `Users`
**Atenção:** A ordem das colunas deve ser exata.
**Formatação:** Selecione as colunas `phone` (F) e `cpf` (G) e vá em **Formatar > Número > Texto Simples** para preservar zeros à esquerda.

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID único do usuário |
| **B** | `name` | Nome completo |
| **C** | `email` | E-mail (Login) |
| **D** | `password` | Senha |
| **E** | `avatar` | Foto (Base64) |
| **F** | `phone` | Telefone |
| **G** | `cpf` | CPF |

---

### 2. Aba: `Transactions`

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID da transação |
| **B** | `description` | Descrição |
| **C** | `amount` | Valor (R$) |
| **D** | `date` | Data (YYYY-MM-DD) - **Formatar como Texto Simples** |
| **E** | `type` | Receita ou Despesa |
| **F** | `category` | Categoria |
| **G** | `userEmail` | Dono da transação |

---

### 3. Aba: `Investments`

| Coluna | Nome (Cabeçalho) | Descrição |
| :--- | :--- | :--- |
| **A** | `id` | ID do investimento |
| **B** | `name` | Nome do ativo |
| **C** | `initialAmount` | Valor investido |
| **D** | `currentValue` | Valor atual |
| **E** | `yieldRate` | Taxa de rendimento |
| **F** | `userEmail` | Dono do investimento |
