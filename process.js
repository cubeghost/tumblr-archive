const nconf = require('nconf');

const Tumblr = require('./api');

const config = nconf.file('./config.json'); // TBD
const token = config.get('oauth:access_token');
const secret = config.get('oauth:access_secret');
const blog = config.get('tumblr:blog');
const tumblr = new Tumblr(token, secret);

tumblr.fetchPosts(blog).then((result) => {
  const json = JSON.stringify(result);
  process.stdout.write(json);
});
