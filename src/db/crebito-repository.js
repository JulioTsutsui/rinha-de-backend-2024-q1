const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOSTNAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  idleTimeoutMillis: 0,
  max: 5,
});

// const pool = new Pool({
//   host: 'localhost',
//   user: 'juliu',
//   password: 'funcionapls',
//   database: 'crebito',
//   idleTimeoutMillis: 0,
//   max: 10,
// });

async function getClientStatus(id) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT saldo as total, limite, NOW() as data_extrato from client where id = $1', [id]);
  
    return res.rows[0];
  } catch (error) {
    client.rollback();
    throw error;
  } finally {
    client.release();
  }
}

async function insertTransaction(id, data) {
  const { valor, tipo, descricao } = data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const clientBalance = await client.query('SELECT saldo as total, limite from client where id = $1 FOR UPDATE', [id]);
    let { total, limite } = clientBalance.rows[0];
    const newBalance = tipo === 'd' ? total -= valor : total += valor;
    
    if (newBalance < -limite) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('INSERT INTO transactions(client_id, valor, tipo, descricao) VALUES ($1, $2, $3, $4)', [id, valor, tipo, descricao]);
    await client.query(`UPDATE client SET saldo = $1 where id = $2 RETURNING limite, saldo`, [newBalance, id]);
    await client.query('COMMIT');

    return {
      limite,
      saldo: newBalance,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getClientTransactions(id) {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT valor, tipo, descricao, realizada_em FROM transactions WHERE client_id = $1 ORDER BY realizada_em DESC LIMIT 10", [id]);

    return res.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getClientStatus, insertTransaction, getClientTransactions }