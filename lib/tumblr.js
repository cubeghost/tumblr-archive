const tumblr = require('tumblr.js');

const POST_LIMIT = 20;

module.exports = class Tumblr {
  constructor(token, secret) {
    this.client = new tumblr.Client({
      credentials: {
        consumer_key: process.env.TUMBLR_API_KEY,
        consumer_secret: process.env.TUMBLR_API_SECRET,
        token: token,
        token_secret: secret,
      },
      returnPromises: true,
    });
  }

  fetchPosts(blog) {
    return new Promise((resolve, reject) => {
      let posts = [];
      let blogInfo = undefined;

      const fetchWithOffset = (offset, retry) => {
        return this.client
          .blogPosts(blog, {
            offset: offset,
            reblog_info: true,
            notes_info: true,
          })
          .then(response => {
            posts = posts.concat(response.posts);

            if (!blogInfo) {
              blogInfo = response.blog;
            }

            if (response.total_posts > POST_LIMIT && offset < response.total_posts) {
              return fetchWithOffset(offset + POST_LIMIT);
            } else {
              return;
            }
          })
          .catch(error => {
            // retry just once
            if (!retry) {
              return fetchWithOffset(offset, true);
            } else {
              reject(error);
            }
          });
      };

      fetchWithOffset(0)
        .then(() => {
          resolve({
            blog: blogInfo,
            posts: posts,
          });
        })
        .catch(reject);
    });
  }
};
