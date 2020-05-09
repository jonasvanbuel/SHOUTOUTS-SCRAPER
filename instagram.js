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

  getNewTaggedLinks: async () => {
    await instagram.page.waitFor(2000);
    // let pageLoad = 0;
    // const mostRecentTaggedLink = '/p/B_5h2EnAkU6/';


    // const newTaggedLinks = await instagram.page.evaluate((mostRecentPathname) => {
    //   const newTaggedLinks = [];
    //   const initiallyLoadedPosts = document.querySelectorAll('.v1Nh3');

    //   initiallyLoadedPosts.forEach((element) => {
    //     const pathname = element.firstChild.pathname;
    //     if (pathname !== mostRecentPathname) {
    //       newTaggedLinks.push(pathname);
    //     }
    //   })
    //   return newTaggedLinks;
    // });

    const pagePathnames = await fetchPagePathnames();

    console.log('Page pathnames received...');
    console.log(pagePathnames);

    console.log('Scrolling down...');
    await scrollDown();
    console.log('Scrolled down...');

    // return pagePathnames;
  },

  createTaggedPost: async (pathname) => {
    const url = `https://www.instagram.com${pathname}`;
    await instagram.page.goto(url, { waitUntil: 'networkidle2' });
  }
};

// HELPER FUNCTIONS
const scrollDown = async () => {
  await instagram.page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
}

const fetchPagePathnames = async () => {
  const pagePathnames = await instagram.page.evaluate(() => {
    const pathnames = [];
    const loadedPosts = document.querySelectorAll('.v1Nh3');
    loadedPosts.forEach((element) => {
      console.log(element.firstChild.pathname);
      console.log(typeof element.firstChild.pathname);
      let pathname = element.firstChild.pathname;
      pathnames.push(pathname);
    })
    return pathnames;
  });
  console.log(pagePathnames);
  return pagePathnames;
}

module.exports = instagram;
