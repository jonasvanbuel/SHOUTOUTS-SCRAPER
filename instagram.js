const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const BASE_URL = 'https://www.instagram.com/';

// Instagram is JS Object (JSON)
const instagram = {
  browser: null,
  page: null,
  serverState: [],

  fetchInitialServerState: async() => {
    const BASE_URL = 'http://localhost:3000';
    const SUBJECT_USERNAME = 'mariotestino';
    const endpoint = `${BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;
    serverState = await fetch(endpoint)
      .then(response => response.json())
      .then(data => data)
    console.log('Initial server state received and set...');
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

    await instagram.page.waitFor(3000);

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

  getInitialLoadTaggedLinks: async () => {
    console.log('getInitialLoadTaggedLinks() called...');
    await instagram.page.waitFor(3000);
    let pageLoad = 0;
    const mostRecentServerLink = 'p/B_47eainp1_/';

    const taggedLinks = await instagram.page.evaluate(() => {
      const taggedLinks = [];
      const initiallyLoadedPosts = document.querySelectorAll('.v1Nh3');
      initiallyLoadedPosts.forEach((element) => {
        taggedLinks.push(element.firstChild.pathname);
      })
      return taggedLinks;
    });
    console.log('Initially downloaded tagged links received...');

    console.log(serverState);


  }
};



module.exports = instagram;
