// index.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const dbconnection = require('./DB/pgConnection');
const bodyParser =  require('body-parser');

const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
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

const dataRouter = require('./routes/project');

app.post('/', (req, res) => {
  res.send('Test');
});

// Routes
app.use('/auth', authRouter);
app.use('/api', dataRouter);
app.use('/api', require('./routes/portfolio'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/members'));
app.use('/api', require('./routes/file'));
app.use('/api', require('./routes/message'));
app.use('/api', require('./routes/milestone'));
app.use('/api', require('./routes/status'));
app.use('/api', require('./routes/document'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
