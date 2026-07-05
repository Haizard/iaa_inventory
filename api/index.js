// Vercel serverless entry point — delegates to the compiled Express app
// TypeScript compiles `export default app` to `exports.default`, so we unwrap it
const server = require('../server/dist/index.js');
module.exports = server.default || server;
