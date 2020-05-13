const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const BASE_URL = 'https://www.instagram.com/';

const instagram = {
  browser: null,
  page: null,
  serverState: null,
  mostRecentPathname: null,
  newPathnames: null,

  fetchInitialServerState: async () => {
    const API_BASE_URL = 'http://localhost:3000';
    const SUBJECT_USERNAME = 'mariotestino';
    const endpoint = `${API_BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;
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

  initialize: async () => {
    instagram.browser = await puppeteer.launch({
      headless: false
    });
    instagram.page = await instagram.browser.newPage();
  },

  login: async (username, password) => {
    await instagram.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    await instagram.page.waitFor(5000);

    await instagram.page.type('input[name="username"]', username, { delay: 100 });
    await instagram.page.type('input[name="password"]', password, { delay: 100 });

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
    console.log('Fetching new pathnames...');
    const mostRecentPathnameProxy = '/p/B_75KCMnLrc/';
    let loadedPathnames = [];
    let pathnamesCollection = [];

    async function fetchLoadedPathnames() {
      await instagram.page.waitFor(5000);
      loadedPathnames = await instagram.page.evaluate(() => {
        const pathnames = [];
        const loadedPosts = document.querySelectorAll('.v1Nh3');
        loadedPosts.forEach((element) => {
          let pathname = element.firstChild.pathname;
          pathnames.push(pathname);
        })
        return pathnames;
      });
      await checkLoadedPathnames();
    };

    async function checkLoadedPathnames() {
      if(loadedPathnames.includes(mostRecentPathnameProxy)) {
        loadedPathnames = loadedPathnames.slice(0, loadedPathnames.indexOf(mostRecentPathnameProxy));
        addLoadedPathnamesToCollection();

        console.log(`Number of new pathnames: ${pathnamesCollection.length}`);
        console.log(pathnamesCollection);

        newPathnames = pathnamesCollection;
      } else {
        addLoadedPathnamesToCollection();
        await scrollDown();
        await fetchLoadedPathnames();
      }
    };

    const addLoadedPathnamesToCollection = () => {
      pathnamesCollection = pathnamesCollection.concat(loadedPathnames)
      pathnamesCollection = pathnamesCollection.filter((value, index, array) => {
        return array.indexOf(value) == index;
      });
    }

    await fetchLoadedPathnames();
  },

  createNewTaggedPost: async () => {
    // const pathnameProxy = '/p/B_5h2EnAkU6/';
    const pathnameProxy = '/p/CAIaDhkATdS/';
    const url = `https://www.instagram.com${pathnameProxy}`;
    await instagram.page.goto(url, { waitUntil: 'networkidle2' });
    await instagram.page.waitFor(3000);

    const taggedPost = await instagram.page.evaluate(() => {
      const taggedPost = {
        instagram_account: 'mariotestino',
        author: document.querySelector('.sqdOP').innerText,
        message: document.querySelector('.C4VMK').children[1].innerHTML.replace(/"/g, "'"),
        posted_at: document.querySelector("._1o9PC").attributes["datetime"].value,
        pathname: window.location.pathname,
        image_url: document.querySelector('.FFVAD').srcset.split(',')[2].split(' ')[0],
        user_avatar_url: document.querySelector('._6q-tv').src,
        likes: parseInt(document.querySelector('.Nm9Fw').firstChild.innerHTML.match(/[\d,]+/g)[0].replace(/,/g, ""))
      };
      return taggedPost;
    });

    const API_BASE_URL = 'http://localhost:3000';
    const SUBJECT_USERNAME = 'mariotestino';
    const endpoint = `${API_BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;

    fetch(endpoint, {
        method: 'post',
        body: JSON.stringify(taggedPost),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then((data) => {
        console.log('New tagged post created');
        console.log(data);
      })
  }


};

// PRIVATE HELPER FUNCTIONS
const scrollDown = async () => {
  await instagram.page.evaluate(() => {
    const randomNumber = Math.random() * 3;
    window.scrollBy(0, window.innerHeight * randomNumber);
  });
};

module.exports = instagram;
