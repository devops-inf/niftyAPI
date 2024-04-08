const pg = require('pg');

const connectionString = "postgresql://kbdb:kaybee@192.168.88.93:12321/niftydb";

const client = new pg.Client({
    connectionString: connectionString,
    acquireConnectionTimeout: 5000
});

client.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL!');
    }
});

client.on('error', (err) => {
    console.error('Error during PostgreSQL client connection:', err);
});

module.exports = client;
