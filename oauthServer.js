const express = require('express');
const session = require('express-session');
const Grant = require('grant-express');
const opn = require('opn');

const PORT = 3000;

module.exports = {
  start: () => {
    return new Promise((resolve, reject) => {
      const app = express();
      let listener = undefined;
      let browserProcess = undefined;

      app.use(session({
        secret: 'omniscient feline',
        saveUninitialized: false,
        resave: false,
      }));

      const grant = new Grant({
        server: {
          protocol: 'http',
          host: `localhost:${PORT}`,
          callback: '/callback',
        },
        tumblr: {
          key: process.env.TUMBLR_API_KEY,
          secret: process.env.TUMBLR_API_SECRET,
        }
      });

      app.use(grant);

      app.get('/callback', function(req, res) {

        res.set('Connection', 'close');
        res.end(`
          <html><body><div style="
            text-align:center;
            font-size:3em;
            padding:20vh;
            font-style:italic;
          ">
            you can close this and go back to the terminal
          </div></body></html>
        `);

        if (browserProcess) {
          browserProcess.kill('SIGHUP');
        }

        listener.close(() => {
          resolve(req.query);
        });
      });

      listener = app.listen(PORT, function() {
        opn(`http://localhost:${PORT}/connect/tumblr`, {
          wait: false,
        }).then((p) => {
          browserProcess = p;
        });
      });

    });
  }
};
