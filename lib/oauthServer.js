const express = require('express');
const session = require('express-session');
const Grant = require('grant-express');
const opn = require('opn');
const robot = require('robotjs');

const PORT = 3000;

const successPage = `
  <html>
    <body>
      <div style="
        text-align:center;
        font-size:3em;
        padding:20vh;
        font-style:italic;
      ">
        closing...
      </div>
    </body>
  </html>
`;

module.exports = {
  start: () => {
    return new Promise((resolve, reject) => {
      const app = express();
      let listener = undefined;
      let browserProcess = undefined;

      app.use(
        session({
          secret: process.env.SESSION_SECRET,
          saveUninitialized: false,
          resave: false,
        })
      );

      const grant = new Grant({
        server: {
          protocol: 'http',
          host: `localhost:${PORT}`,
          callback: '/callback',
        },
        tumblr: {
          key: process.env.TUMBLR_API_KEY,
          secret: process.env.TUMBLR_API_SECRET,
        },
      });

      app.use(grant);

      app.get('/callback', function(req, res) {
        res.set('Connection', 'close');
        res.end(successPage);

        if (browserProcess) {
          browserProcess.kill('SIGHUP');
        }

        robot.keyTap('w', 'command');

        listener.close(() => {
          resolve(req.query);
        });
      });

      app.use((err) => {
        reject(err);
      });

      listener = app.listen(PORT, function() {
        opn(`http://localhost:${PORT}/connect/tumblr`, {
          wait: false,
        }).then(p => {
          console.log('\n' + p.pid);
          console.log(p);

          p.on('error', (error) => {
            console.log(error)
          })

          browserProcess = p;
        });
      });
    });
  },
};
