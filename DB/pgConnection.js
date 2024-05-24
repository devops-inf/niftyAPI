// const pg = require('pg');

// const connectionString = "postgres://kbdb:kaybee@192.168.88.93:5432/niftydb";

// const client = new pg.Client({
//     connectionString: connectionString,
//     acquireConnectionTimeout: 5000
// });

// client.connect((err) => {
//     if (err) {
//         console.log('Error connecting to PostgreSQL:', err);
//     } else {
//         console.log('Connected to PostgreSQL!');

        
//     }
// });
//module.exports = client;

const mysql = require('mysql');

//Create a connection to the database
const db = mysql.createConnection({
    host: 'rs19.cphost.co.za',
    user: 'infini13_kabelo',
    password: 'O]hCmzCIkz5H',
    database: 'infini13_infini13_niftydb'
});

// const db = mysql.createConnection({
//     host: '127.0.0.1',
//     user: 'root',
//     password: '',
//     database: 'infini13_infini13_niftydb'
// });

// Connect to the database
db.connect(function(error) {
    if (error) {
        console.error('Error connecting to the database:', error);
        return;
    } else {
        console.log('Connected to the database');
        
        //Query the database
        
        // const query = 'INSERT INTO member (id, user_id, email, name, initials, team, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
        // const values = ['GFYBVBVRV', 'HJBVSB', 'DVBJH', 'FVGHVUYV', 'HJB', 'IT', 'REGULAR'];
        // db.query(query, values);
        
    }
});

module.exports = db;




