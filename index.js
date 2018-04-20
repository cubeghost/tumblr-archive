#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const chalk = require('chalk');
const nconf = require('nconf');
const inquirer = require('inquirer');
const yargs = require('yargs');
const ora = require('ora');
const { spawn } = require('child-process-promise');

const oauthServer = require('./lib/oauthServer');
const promptQuestions = require('./lib/promptQuestions');

const config = nconf.file('./config.json');
const pause = new Promise((resolve) => setTimeout(resolve, 800));
const ONE_DAY = 86400000;

process.on('unhandledRejection', err => {
  console.log(err);
});

// blog passed in as command line argument
if (yargs.argv && yargs.argv._ && yargs.argv._.length) {
  config.set('tumblr:blog', yargs.argv._[0]);
  config.save();
}

Promise.resolve()
  .then(() => {
    // INITIAL CONFIG
    const spinner = ora(' loading config').start();

    if (config.get('tumblr:blog')) {
      return pause.then(() => spinner);
    } else {
      spinner.stop();
      return pause.then(() => inquirer.prompt(promptQuestions)).then(answers => {
        config.set('tumblr:blog', answers.blog);
        config.save();
        spinner.start();
        return spinner;
      });
    }
  })
  .then(spinner => {
    spinner.stopAndPersist({
      symbol: '📎',
      text: chalk.bold(' config loaded'),
    });
    return pause;
  })
  .then(() => {
    // AUTHENTICATE WITH OAUTH
    const spinner = ora(' authenticating').start();
    const spinnerStopOptions = {
      symbol: '🔐',
      text: chalk.bold(' authenticated'),
    };

    const token = config.get('oauth:token');
    const secret = config.get('oauth:secret');
    const lastAuthenticated = config.get('oauth:lastAuthenticated');
    const unixTime = Date.now();

    // get new tokens if current tokens are greater than a day old
    if (!token || !secret || !lastAuthenticated || (lastAuthenticated && unixTime - ONE_DAY >= lastAuthenticated)) {
      return oauthServer.start().then(credentials => {
        config.set('oauth:token', credentials.access_token);
        config.set('oauth:secret', credentials.access_secret);
        config.set('oauth:lastAuthenticated', unixTime);
        config.save();

        spinner.stopAndPersist(spinnerStopOptions);
        return {
          token: credentials.access_token,
          secret: credentials.access_secret,
        };
      });
    } else {
      spinner.stopAndPersist(spinnerStopOptions);
      return {
        token: token,
        secret: secret,
      };
    }
  })
  .then(() => {
    // FETCH EVERY POST
    const spinner = ora(' fetching posts').start();

    return spawn('node', ['lib/process.js'], {
      capture: ['stdout'],
    }).then(response => {
      spinner.stopAndPersist({
        symbol: '📝',
        text: chalk.bold(' fetched posts'),
      });

      return JSON.parse(response.stdout.toString());
    });
  })
  .then(result => {
    // if (result.posts.length) {
    //   const lastPostTimestamp = result.posts[0].timestamp;
    //   config.set('tumblr:lastPostTimestamp', lastPostTimestamp);
    //   config.save();
    // }

    return result;
  })
  .then(result => {
    // SAVE TO FILE
    const spinner = ora(' saving').start();
    const blog = config.get('tumblr:blog');
    const filename = `${blog}.archive.json`;
    const file = JSON.stringify(result, null, 2);

    return new Promise((resolve, reject) => {
      fs.writeFile(filename, file, 'utf8', error => {
        if (error) {
          reject(error);
        } else {
          spinner.stopAndPersist({
            symbol: '💾',
            text: chalk.bold(` saved to ${chalk.underline.bold(filename)}`),
          });

          resolve();
        }
      });
    });
  })
  .then(() => {
    config.clear('tumblr:blog');
    config.save();

    process.exit();
  })
  .catch(err => {
    throw err;
  });
