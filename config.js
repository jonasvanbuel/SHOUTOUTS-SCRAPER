const dotenv = require('dotenv');

dotenv.config();

let API_BASE_URL = null;
if (process.env.NODE_ENV === 'development') {
  API_BASE_URL = 'http://localhost:3000';
}
if (process.env.NODE_ENV === 'production') {
  API_BASE_URL = 'https://shoutouts-stream.herokuapp.com';
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  DEVISE: process.env.DEVISE,
  API_BASE_URL: API_BASE_URL,
  INSTA_BASE_URL: 'https://instagram.com'
};
