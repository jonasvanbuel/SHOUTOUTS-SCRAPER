const ig = require('./instagram');

const initialize = async () => {
  await ig.fetchServerState();
  ig.setMostRecentPathname();

  await ig.initialize();
  await ig.login('socialdeckone', 'socialdeck1');
  await fetchNewPosts();
};

const fetchNewPosts = async () => {
  await ig.gotToSubjectTaggedPage();
  await ig.findNewTaggedPosts();
  await ig.createNewTaggedPosts();
  await updateLikes();
};

const updateLikes = async () => {
  await ig.updateTaggedPosts();
  await fetchNewPosts();
};

initialize();
