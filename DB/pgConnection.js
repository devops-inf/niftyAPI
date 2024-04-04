const {Client} = require('pg')

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "12345678",
    database: "niftydb"
})

client.connect();

// client.query('Select * from projects', (err, res)=>{
//     if (!err) {
//         console.log(res.rows)
//     } else {
//         console.log(res.message)
//     }
//     client.end;
// })

module.exports = client;