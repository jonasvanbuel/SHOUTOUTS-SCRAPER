const instagram = require('./instagram');

const subject = 'mariotestino';

(async () => {
  await instagram.fetchInitialServerState();
  await instagram.initialize();
  await instagram.login('socialdeckone', 'socialdeck1');
  await instagram.gotToSubjectTaggedPage(subject);
  await instagram.getInitialLoadTaggedLinks();





})();
