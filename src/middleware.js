const { getClientStatus } = require("./db/crebito-repository");

const transactionSchema = {
  tipo: {
    required: true,
    max: 1,
    format: "c ou d",
    formatRegex: /c|d/,
    type: "string",
  },
  descricao: {
    required: true,
    type: "string",
    max: 10,
  }
}

function transactionValidationmiddleware(request, response, next) {
  const { body } = request;
  const errors = [];

  // Schema validation
  Object.keys(transactionSchema).forEach(key => {
    const schemaItem = transactionSchema[key];
    const hasProperty = body[key];
    if (schemaItem.required && !hasProperty) errors.push(`O campo "${key}" é obrigatório.`);

    if (hasProperty) {
      if (schemaItem.max && body[key].length > schemaItem.max) errors.push(`O tamanho máximo do campo "${key}" é de ${schemaItem.max}`);
      if (schemaItem.type && typeof body[key] !== schemaItem.type) errors.push(`O campo "${key}" é do tipo ${schemaItem.type}`);
      if (schemaItem.format && !schemaItem.formatRegex.test(body[key])) errors.push(`O formato do campo "${key}" é ${schemaItem.format}`);
    }
  });

  if (errors.length > 0) return response.status(400).json({ errors });
  next()
}

async function clientValidationMiddleware(request, response, next) {
  const { params } = request;

  if (!params.id && typeof params.id !== 'number') return response.status(400).json({ errors: "O parametro \"id\" precisa ser um número inteiro" });

  next();
}

module.exports = { transactionValidationmiddleware, clientValidationMiddleware };