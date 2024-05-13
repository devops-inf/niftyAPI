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

const db = mysql.createConnection({
    host: 'rs19.cphost.co.za',
    user: 'infini13_kabelo',
    password: 'Wf#R@?FYUEf[',
    database: 'infini13_niftydb'
});

db.connect(function(error,res){
    if (!!error) {
        console.log('Error');
       
        res.json({code : 100, status : "Error in connection database"});
		return;
    } else {
        console.log('Connected to the database');
        
        // db.query('SELECT * FROM projects', function(queryError, results, fields) {
        //     if (queryError) {
        //         console.error('Error executing query:', queryError);
        //         return;
        //     }
    
        //     // Log the results
        //     console.log('Data fetched from the projects table:', results);
        // });
    }
});


module.exports=db;



