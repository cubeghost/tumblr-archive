module.exports = [
  {
    type: 'input',
    name: 'blog',
    message: 'Tumblr URL',
    filter: value => {
      return value
        .toLowerCase()
        .replace(/\.tumblr\.com/, '')
        .replace(/https?/, '')
        .replace(/[/:]/g, '');
    },
  },
  // {
  //   type: 'confirm',
  //   name: 'isOwnBlog',
  //   message: 'Is this your own blog?',
  //   default: true,
  // },
  // {
  //   type: 'confirm',
  //   name: 'backupDrafts',
  //
  //   when: (answers) => {
  //     return answers.isOwnBlog;
  //   }
  // }
];
