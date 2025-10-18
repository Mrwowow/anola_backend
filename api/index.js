// Vercel Serverless Function Entry Point
const app = require('../src/app');

// Vercel requires the app to be exported as the default export
// The app is an Express instance that will be wrapped by Vercel
module.exports = app;
