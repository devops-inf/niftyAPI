// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = process.env.ACCESS_TOKEN;
  
  if (!token) {
    console.log(JSON.stringify(req.session));
    return res.status(401).json({ message: 'Authorization token is required' });
  }
  
  try {

    console.log ('Token from the authentication file: '+ token )

    const decoded = jwt.verify(token, process.env.APP_SECRET);
    
    req.user = decoded.process.env.CLIENT_ID;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  
};

module.exports = authenticate;
