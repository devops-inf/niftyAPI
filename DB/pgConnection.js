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

// Create a connection to the database
const db = mysql.createConnection({
    host: 'rs19.cphost.co.za',
    user: 'infini13_kabelo',
    password: 'O]hCmzCIkz5H',
    database: 'infini13_infini13_niftydb'
});

// Connect to the database
db.connect(function(error) {
    if (error) {
        console.error('Error connecting to the database:', error);
        return;
    } else {
        console.log('Connected to the database');
        
        // Query the database
        db.query('SELECT * FROM member', function(queryError, results, fields) {
            if (queryError) {
                console.error('Error executing query:', queryError);
                return;
            }

            // Log the results
            console.log('Data fetched from the member table:', results);
        });
    }
});

module.exports = db;




