const mysql = require('mysql2')

const pool = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.u610580921_julia,
password: process.env.Junior93720,
database: process.env.u610580921_smartos,
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
});

pool.getConnection((err, conn) => {
if(err) console.log(err)
console.log("Connected successfully")
})

module.exports = pool.promise()
