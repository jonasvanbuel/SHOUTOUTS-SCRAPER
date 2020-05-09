const instagram = require('./instagram');

const subject = 'mariotestino';

(async () => {
  const initialServerState = await instagram.fetchInitialServerState();
  await instagram.setMostRecentPathname();
  // console.log(initialServerState);

  await instagram.initialize();
  await instagram.login('socialdeckone', 'socialdeck1');
  await instagram.gotToSubjectTaggedPage(subject);

  await instagram.getNewTaggedLinks();
  // await instagram.createTaggedPost('/p/B_5h2EnAkU6/');

  // taggedLinks.forEach(taggedLink => {
  //   await instagram.createTaggedPost(taggedLink);
  // })
})();
