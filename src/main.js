const express = require("express");
const { clientValidationMiddleware, transactionValidationmiddleware } = require("./middleware");
const { getClientStatus, getClientTransactions, insertTransaction } = require("./db/crebito-repository");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8080;

app.post("/clientes/:id/transacoes", [clientValidationMiddleware, transactionValidationmiddleware], async (request, response) => {
  try {
    const { params } = request;

    const res = await insertTransaction(params.id, request.body);
    if (!res) return response.status(422).json({ error: 'O cliente não tem limite para fazer a operação' });

    return response.status(200).json(res);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

app.get("/clientes/:id/extrato", clientValidationMiddleware, async (request, response) => {
  try {
    const { params } = request;

    const saldo = await getClientStatus(params.id);

    if (!saldo) return response.status(404).json({ errors: 'Cliente não encontrado' });

    const ultimas_transacoes = await getClientTransactions(params.id);

    const res = {
      saldo,
      ultimas_transacoes,
    };

    return response.status(200).json(res);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));