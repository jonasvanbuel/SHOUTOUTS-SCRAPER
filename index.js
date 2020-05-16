const ig = require('./instagram');

(async () => {
  await ig.fetchServerState();
  await ig.setMostRecentPathname();

  await ig.initialize();
  await ig.login('socialdeckone', 'socialdeck1');
  await ig.gotToSubjectTaggedPage('mariotestino');

  await ig.getNewPathnames();
  await ig.createNewTaggedPosts();

  // await ig.updateTaggedPosts();

  await ig.browser.close();
})();

// Test comment - to be deleted v2
