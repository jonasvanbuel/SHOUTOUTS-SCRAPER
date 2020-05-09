const instagram = require('./instagram');

const subject = 'mariotestino';

(async () => {
  const initialServerState = await instagram.fetchInitialServerState();
  await instagram.setMostRecentPathname();

  await instagram.initialize();
  await instagram.login('socialdeckone', 'socialdeck1');
  await instagram.gotToSubjectTaggedPage(subject);

  const newPathnames = await instagram.getNewPathnames();
  console.log(newPathnames);

  // await instagram.createTaggedPost('/p/B_5h2EnAkU6/');

  // taggedLinks.forEach(taggedLink => {
  //   await instagram.createTaggedPost(taggedLink);
  // })
})();
