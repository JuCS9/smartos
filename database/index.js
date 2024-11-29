require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const mysql = require('mysql2');

// Configuração do pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DBNAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Teste de conexão
(async () => {
  try {
    const connection = await pool.promise().getConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    connection.release(); // Libera a conexão
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
  }
})();

// Exporta o pool para uso em outros arquivos
module.exports = pool.promise();



