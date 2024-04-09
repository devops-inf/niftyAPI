const pg = require('pg');

const connectionString = "https://kbdb:kaybee@localhost:5432/niftydb";

const client = new pg.Client({
    connectionString: connectionString,
    acquireConnectionTimeout: 5000
});

client.connect((err) => {
    if (err) {
        console.log('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL!');

        
    }
});

// client.query('SELECT NOW()', (err, result) => {
//     if (err) {
//         console.error('Error executing query:', err);
//     } else {
//         console.log('Query result:', result.rows);
//     }

//     // Close the client connection
//     client.end();
// });
client.on('error', (err) => {
    console.error('Error during PostgreSQL client connection:', err);
});

module.exports = client;
