const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const BASE_URL = 'https://www.instagram.com/';

// Instagram is JS Object (JSON)
const instagram = {
  browser: null,
  page: null,
  serverState: null,
  mostRecentPathname: null,

  fetchInitialServerState: async () => {
    const BASE_URL = 'http://localhost:3000';
    const SUBJECT_USERNAME = 'mariotestino';
    const endpoint = `${BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;
    serverState = await fetch(endpoint)
      .then(response => response.json())
      .then(data => data)

    if (serverState) {
      console.log('Initial server state received set...');
      return serverState;
    }
  },

  setMostRecentPathname: async () => {
    let mostRecentDateTime = null;
    let mostRecentPost = null;

    for (const taggedPost of serverState) {
      if (Date.parse(taggedPost.posted_at) >= mostRecentDateTime || !mostRecentDateTime) {
        mostRecentDateTime = Date.parse(taggedPost.posted_at);
        mostRecentPost = taggedPost;
      }
    }

    if (mostRecentPost.pathname) {
      mostRecentPathname = mostRecentPost.pathname;
      console.log('mostRecentPathname set...');
    }
  },

  // First instagram function is `initialize`
  initialize: async () => {
    instagram.browser = await puppeteer.launch({
      headless: false
    });
    instagram.page = await instagram.browser.newPage();
  },

  login: async (username, password) => {
    await instagram.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    await instagram.page.waitFor(1500);

    await instagram.page.type('input[name="username"]', username, { delay: 50 });
    await instagram.page.type('input[name="password"]', password, { delay: 50 });

    // REFACTOR BELOW
    let loginButton = await instagram.page.$x('//*[@id="react-root"]/section/main/article/div[2]/div[1]/div/form/div[4]/button');
    await loginButton[0].click();
  },

  gotToSubjectTaggedPage: async (subject) => {
    await instagram.page.waitForNavigation({ waitUntil: 'networkidle2' });

    const subjectUrl = `https://www.instagram.com/${subject}/tagged`;
    await instagram.page.goto(subjectUrl, { waitUntil: 'networkidle2' });
    console.log('Subject tagged page loaded...');
  },

  getNewPathnames: async () => {
    const mostRecentPathnameProxy = '/p/B_75KCMnLrc/';

    // TO DO: INSTEAD WAIT UNTIL POSTS ARE LOADED!
    await instagram.page.waitFor(5000);
    let pagePathnames = await fetchPagePathnames();

    async function checkAndRefetchPathnames() {
      if(pagePathnames.includes(mostRecentPathnameProxy)) {
        // FILTER ONLY NEW PAGEPATHNAMES
        pagePathnames = pagePathnames.slice(0, pagePathnames.indexOf(mostRecentPathnameProxy));
        console.log('mostRecentPathnameProxy FOUND in current pagePathnames...');
        console.log(`Final count: ${pagePathnames.length}`);
      } else {
        // SCROLL + REDO
        console.log(`Current count: ${pagePathnames.length}`);
        console.log('mostRecentPathnameProxy NOT found in current pagePathnames...');
        await scrollDown();

        // TO DO: INSTEAD WAIT UNTIL POSTS ARE LOADED!
        await instagram.page.waitFor(10000);

        pagePathnames = await fetchPagePathnames();
        await checkAndRefetchPathnames();
      }
    };

    await checkAndRefetchPathnames();
    return pagePathnames;
  },

  createTaggedPost: async (pathname) => {
    const url = `https://www.instagram.com${pathname}`;
    await instagram.page.goto(url, { waitUntil: 'networkidle2' });
  }
};

// PRIVATE HELPER FUNCTIONS
const scrollDown = async () => {
  await instagram.page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
  console.log('Scrolled down...');
}

const fetchPagePathnames = async () => {
  const pagePathnames = await instagram.page.evaluate(() => {
    const pathnames = [];
    const loadedPosts = document.querySelectorAll('.v1Nh3');
    loadedPosts.forEach((element) => {
      let pathname = element.firstChild.pathname;
      pathnames.push(pathname);
    })
    return pathnames;
  });
  return pagePathnames;
}

module.exports = instagram;
