
# Configuração da Planilha Google (Banco de Dados)

Para que o script do Google Apps Script funcione, você precisa criar uma planilha nova e configurar 3 abas (páginas) com os nomes e colunas exatos abaixo.

A ordem das colunas é importante.

### 1. Aba: `Users`
Renomeie a "Página1" para `Users` ou crie uma nova.

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E |
| :--- | :--- | :--- | :--- | :--- |
| **id** | **name** | **email** | **password** | **avatar** |

---

### 2. Aba: `Transactions`
Crie uma nova aba chamada `Transactions`.

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E | Coluna F | Coluna G |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | **description** | **amount** | **date** | **type** | **category** | **userEmail** |

---

### 3. Aba: `Investments`
Crie uma nova aba chamada `Investments`.

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E | Coluna F |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | **name** | **initialAmount** | **currentValue** | **yieldRate** | **userEmail** |

---

## Observações Importantes

1. **Cabeçalhos:** A primeira linha (Linha 1) de cada aba deve conter os títulos acima. O script sempre começa a ler a partir da Linha 2.
2. **Formato da Data:** Na coluna `date` da aba `Transactions`, selecione a coluna inteira no Google Sheets e vá em **Formatar > Número > Texto Simples**. Isso evita que o Google converta datas automaticamente e cause erros de leitura no JSON.
3. **Avatar:** A coluna de Avatar armazenará o texto em Base64 da imagem. Se a imagem for muito grande, o Google Sheets pode cortar o texto (limite de 50.000 caracteres por célula). Para testes simples funciona, mas para produção recomenda-se armazenar imagens no Google Drive e salvar apenas o Link (ID) na planilha.
