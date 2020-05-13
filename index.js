const instagram = require('./instagram');

(async () => {
  await instagram.fetchInitialServerState();
  await instagram.setMostRecentPathname();

  await instagram.initialize();
  await instagram.login('socialdeckone', 'socialdeck1');
  // await instagram.gotToSubjectTaggedPage('mariotestino');

  // await instagram.getNewPathnames();

  await instagram.createNewTaggedPost();

  // taggedLinks.forEach(taggedLink => {
  //   await instagram.createTaggedPost(taggedLink);
  // })
})();
