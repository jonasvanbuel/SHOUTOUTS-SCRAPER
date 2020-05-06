const puppeteer = require('puppeteer');

const BASE_URL = 'https://www.instagram.com/';
const SUBJECT_URL = 'https://www.instagram.com/mariotestino/tagged/';

const instagram = {
  browser: null,
  page: null,

  // First instagram function is `initialize`
  initialize: async () => {
    instagram.browser = await puppeteer.launch({
      headless: false
    });
    instagram.page = await instagram.browser.newPage();
  },

  login: async (username, password) => {
    await instagram.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    await instagram.page.waitFor(1000);

    await instagram.page.type('input[name="username"]', username, { delay: 50 });
    await instagram.page.type('input[name="password"]', password, { delay: 50 });

    // REFACTOR BELOW
    let loginButton = await instagram.page.$x('//*[@id="react-root"]/section/main/article/div[2]/div[1]/div/form/div[4]/button');
    await loginButton[0].click();
  },

  getTaggedLinks: async (username) => {
    await instagram.page.waitForNavigation({ waitUntil: 'networkidle2' });

    const subjectUrl = `https://www.instagram.com/${username}/tagged`;
    await instagram.page.goto(subjectUrl, { waitUntil: 'networkidle2' });

    await instagram.page.waitFor(5000);
    let taggedPostsRows = await instagram.page.$x('//div[contains(@class, "Nnq7C")]');

    const taggedPostsUrls = [];

    for(let i = 0; i < 3; i++) {

      debugger
      let url = taggedPostsRows[0];
    }

  }
};

module.exports = instagram;
