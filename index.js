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
    await igTaggedPosts.openHomepage();
    await igTaggedPosts.acceptCookies();

    await igTaggedPosts.login(LOGIN_USERNAME, LOGIN_PASSWORD);

    await igTaggedPosts.gotToSubjectTaggedPage(INSTAGRAM_ACCOUNT);
    await igTaggedPosts.fetchPostsUrls();
    await igTaggedPosts.sendTaggedPosts();
  }

  if (POST_TYPE == "hashtag") {
    // await igHashtagPosts.fetchServerState();
    await igHashtagPosts.initialize();
    await igHashtagPosts.openHomepage();
    await igHashtagPosts.acceptCookies();

    await igHashtagPosts.login(LOGIN_USERNAME, LOGIN_PASSWORD);

    await igHashtagPosts.gotToHashtagPage(HASHTAG_NAME);
    await igHashtagPosts.fetchPostsUrls();
    await igHashtagPosts.sendHashtagPosts();
  }
};

initialize();
