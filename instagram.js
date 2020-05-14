const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const BASE_URL = 'https://www.instagram.com/';

const instagram = {
  browser: null,
  page: null,
  serverState: null,
  mostRecentPathname: null,
  newPathnames: null,

  fetchServerState: async () => {
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
      console.log(`mostRecentPathname set: "${mostRecentPathname}"...`);
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
    if (!mostRecentPathname) {
      console.log('mostRecentPathname not successfully set...');
    };

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

      // If mostRecentPathname is loaded and we reach end of scraping cycle
      if(loadedPathnames.includes(mostRecentPathname)) {
        loadedPathnames = loadedPathnames.slice(0, loadedPathnames.indexOf(mostRecentPathname));
        addLoadedPathnamesToCollection();

        console.log(`Number of new pathnames: ${pathnamesCollection.length}`);
        console.log(pathnamesCollection);
        newPathnames = pathnamesCollection;

        await instagram.page.close();

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

  createNewTaggedPosts: async () => {
    const tempNewPathnames = newPathnames.slice().reverse();

    for (const newPathname of tempNewPathnames) {
      const postUrl = `https://www.instagram.com${newPathname}`;

      // OPEN NEW WINDOW
      const page = await instagram.browser.newPage();
      await page.goto(postUrl, { waitUntil: 'networkidle2' });
      await page.waitFor(3000);

      const taggedPost = await page.evaluate(() => {
        const taggedPost = {
          // instagram_account: 'mariotestino',
          author: document.querySelector('.sqdOP').innerText,
          message: document.querySelector('.C4VMK').children[1].innerHTML.replace(/"/g, "'"),
          posted_at: document.querySelector("._1o9PC").attributes["datetime"].value,
          pathname: window.location.pathname,
          image_url: document.querySelector('.FFVAD').srcset.split(',')[2].split(' ')[0],
          user_avatar_url: document.querySelector('._6q-tv').src,
          likes: parseInt(document.querySelector('.Nm9Fw button span').innerText.replace(/,/g, ""))
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
          console.log(`New tagged post created from "${newPathname}"...`);
          serverState = data;
        })

      // CLOSE WINDOW
      await page.close();
    }
  },

  updateTaggedPosts: async () => {
    serverState = await instagram.fetchServerState();
    serverStateCopy = serverState;

    for (const taggedPost of serverStateCopy) {
      const page = await instagram.browser.newPage();
      await page.goto(`https://www.instagram.com${taggedPost.pathname}`, { waitUntil: 'networkidle2' });
      await page.waitFor(3000);

      const body = await page.evaluate(() => {
        return {
          likes: parseInt(document.querySelector('.Nm9Fw button span').innerText.replace(/,/g, ""))
        }
      })

      body["pathname"] = taggedPost.pathname;

      const API_BASE_URL = 'http://localhost:3000';
      const SUBJECT_USERNAME = 'mariotestino';
      const endpoint = `${API_BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;

      fetch(endpoint, {
          method: 'patch',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then((data) => {
          serverState = data;
        })
    }
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
