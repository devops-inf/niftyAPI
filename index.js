// index.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const authRouter = require('./routes/auth');
const dbconnection = require('./DB/pgConnection');
const bodyParser =  require('body-parser');


const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(session({
  secret: process.env.APP_SECRET, // Secret key used to sign the session ID cookie
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000 * 60,
    httpOnly: true
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.use(cors);

const dataRouter = require('./routes/data');

app.post('/', (req, res) => {
  res.send('Test');
});

// Routes
app.use('/auth', authRouter);
app.use('/api', dataRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
