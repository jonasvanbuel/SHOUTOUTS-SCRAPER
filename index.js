const igTaggedPosts = require('./instagram_tagged_posts');
const igHashtagPosts = require('./instagram_hashtag_posts');

const config = require('./config');

const initialize = async () => {
  const {
    POST_TYPE,
    INSTAGRAM_ACCOUNT,
    HASHTAG_NAME,
    LOGIN_USERNAME,
    LOGIN_PASSWORD
  } = config;

  if (POST_TYPE == "tagged_post") {
    // await igTaggedPosts.fetchServerState();
    // igTaggedPosts.setMostRecentPathname();
    await igTaggedPosts.initialize();
    await igTaggedPosts.login(LOGIN_USERNAME, LOGIN_PASSWORD);
    await fetchNewPosts();
    const fetchNewPosts = async () => {
      await igTaggedPosts.gotToSubjectTaggedPage();
      await igTaggedPosts.findNewTaggedPosts();
      await igTaggedPosts.createNewTaggedPosts();
      await updateLikes();
    };
    const updateLikes = async () => {
      await igTaggedPosts.updateTaggedPosts();
      await fetchNewPosts();
    };
  }

  if (POST_TYPE == "hashtag") {
    // await igHashtagPosts.fetchServerState();
    await igHashtagPosts.initialize();
    await igHashtagPosts.openHomepage();
    await igHashtagPosts.acceptCookies();

    await igHashtagPosts.login(LOGIN_USERNAME, LOGIN_PASSWORD);

    await igHashtagPosts.gotToHashtagPage(HASHTAG_NAME);
    await igHashtagPosts.fetchPostUrls();
    await igHashtagPosts.sendHashtagPosts();
  }
};

initialize();
