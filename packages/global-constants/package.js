Package.describe({
  name: 'global-constants',
  summary: ' /* Fill me in! */ ',
  version: '1.0.0',
  git: ' /* Fill me in! */ '
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2.1');
  api.export('Future');
  api.export('Schema');
  api.export('vsprintf');
  api.export('sprintf');
  api.export('nodemailer');
  api.export('wepay');
  api.addFiles('global-constants.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('global-constants');
  api.addFiles('global-constants-tests.js');
});

/* This lets you use npm packages in your package*/
Npm.depends({
  "wepay": "0.0.4",
  "nodemailer": "1.3.0",
  "sprintf-js": "1.0.2"
});