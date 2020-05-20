const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const config = require('./config');

const ig = {
  SUBJECT: 'mariotestino',
  browser: null,
  page: null,
  serverState: null,
  mostRecentPathname: null,
  newPathnames: null,

  fetchServerState: async () => {
    const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/${ig.SUBJECT}`;
    serverState = await fetch(endpoint)
      .then(response => response.json())
      .then(data => data)

    if (serverState) {
      console.log('Server state received...');
    }
    return serverState;
  },

  setMostRecentPathname: () => {
    let mostRecentDateTime = null;
    let mostRecentPost = null;

    for (const taggedPost of serverState) {
      if (Date.parse(taggedPost.posted_at) >= mostRecentDateTime || !mostRecentDateTime) {
        mostRecentDateTime = Date.parse(taggedPost.posted_at);
        mostRecentPost = taggedPost;
      }
    }

    if (mostRecentPost.pathname) {
      ig.mostRecentPathname = mostRecentPost.pathname;
      console.log(`mostRecentPathname set: "${ig.mostRecentPathname}"...`);
    }
  },

  initialize: async () => {
    // Detect which devise is scraping: 'MAC' or 'RASP'
    let options = null;
    if (config.DEVISE === 'MAC') {
      options = {
        headless: false
      }
    }
    if (config.DEVISE === 'RASP') {
      options = {
        executablePath: '/usr/bin/chromium-browser',
        headless: false
      }
    }
    ig.browser = await puppeteer.launch(options);
    ig.page = await ig.browser.newPage();
  },

  login: async (username, password) => {
    await ig.page.goto(config.INSTA_BASE_URL, { waitUntil: 'networkidle2' });

    await ig.page.waitFor(1000);

    await ig.page.type('input[name="username"]', username, { delay: 100 });
    await ig.page.type('input[name="password"]', password, { delay: 100 });

    // REFACTOR BELOW
    let loginButton = await ig.page.$x('//*[@id="react-root"]/section/main/article/div[2]/div[1]/div/form/div[4]/button');

    await loginButton[0].click();
    await ig.page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in...');
  },

  gotToSubjectTaggedPage: async () => {
    ig.page = await ig.browser.newPage();
    await ig.page.goto(`${config.INSTA_BASE_URL}/${ig.SUBJECT}/tagged`, { waitUntil: 'networkidle2' });
    console.log('Tagged page loaded...');
  },

  findNewTaggedPosts: async () => {
    console.log('Finding new tagged posts...');

    if (!ig.mostRecentPathname) {
      console.log('mostRecentPathname not successfully set...');
    };

    let loadedPathnames = [];
    let pathnamesCollection = [];

    async function fetchLoadedPathnames() {
      await ig.page.waitFor(5000);

      loadedPathnames = await ig.page.evaluate(() => {
        const loadedPathnames = [];
        const loadedPosts = document.querySelectorAll('.v1Nh3');
        loadedPosts.forEach((element) => {
          let pathname = element.firstChild.pathname;
          loadedPathnames.push(pathname);
        })
        return loadedPathnames;
      });

      await checkLoadedPathnames();
    };

    async function checkLoadedPathnames() {
      // const mostRecentPathnameProxy = '/p/CANTfhiFO6S/';

      // If mostRecentPathname is loaded and we reach end of scraping cycle
      if(loadedPathnames.includes(ig.mostRecentPathname) || pathnamesCollection.length >= 250) {
        loadedPathnames = loadedPathnames.slice(0, loadedPathnames.indexOf(ig.mostRecentPathname));
        addLoadedPathnamesToCollection();
        console.log(`Number of new tagged posts: ${pathnamesCollection.length}`);
        ig.newPathnames = pathnamesCollection;
        await ig.page.close();
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
    if (ig.newPathnames.length > 0) {
      console.log('Creating new tagged posts...');
    }
    if (ig.newPathnames.length === 0) {
      console.log('No new tagged posts to be created...');
    }
    const newPathnamesCopy = ig.newPathnames.slice().reverse();

    for (const newPathname of newPathnamesCopy) {
      const page = await ig.browser.newPage();
      await page.goto(`${config.INSTA_BASE_URL}${newPathname}`, { waitUntil: 'networkidle2' });
      await page.waitFor(4000);

      const taggedPost = await page.evaluate(() => {
        // This function needs to be externalized since being reused in updateLikes()
        const fetchLikes = () => {
          // If image is loaded => "LIKES"
          // If likes div is present
          const imageDiv = document.querySelector('.Nm9Fw');
          if (imageDiv) {
            if (document.querySelector('.Nm9Fw button span')) {
              return document.querySelector('.Nm9Fw button span').innerText.replace(/,/g, "");
            }
            if (document.querySelector('.Nm9Fw button').innerText === 'like this') {
              return 0;
            }
            // IF "Liked by Mario Testino and 1 other"
            if (document.querySelector('.Nm9Fw button')) {
              let number = document.querySelector('.Nm9Fw button').innerText.match(/\d/g).join();
              return parseInt(number) + 1;
            }
          }

          // If video is loaded => "VIEWS"
          if (document.querySelector('.HbPOm')) {
            if (document.querySelector('.HbPOm span span')) {
              return document.querySelector('.HbPOm span span').innerText.replace(/,/g, "");
            }
          }
        };

        const fetchImgUrl = () => {
          // If video
          if (document.querySelector('._8jZFn')) {
            return document.querySelector('._8jZFn').src;
          }
          // If image
          if (document.querySelector('.FFVAD')) {
            return document.querySelector('.FFVAD').srcset.split(',')[0].split(' ')[0];
          }
          console.log("Problem with fetching image url...");
        }

        return {
          author: document.querySelector('.sqdOP').innerText,
          message: document.querySelector('.C4VMK') ? document.querySelector('.C4VMK').children[1].innerHTML.replace(/"/g, "'") : "",
          posted_at: document.querySelector("._1o9PC").attributes["datetime"].value,
          pathname: window.location.pathname,
          image_url: fetchImgUrl(),
          user_avatar_url: document.querySelector('._6q-tv').src,
          likes: parseInt(fetchLikes())
        };
      });

      const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/${ig.SUBJECT}`;
      fetch(endpoint, {
          method: 'post',
          body: JSON.stringify(taggedPost),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then((data) => {
          serverState = data;

          // Delete this pathname from 'newPathnames' array in module state
          const index = ig.newPathnames.indexOf(newPathname);
          if (index > -1) {
            ig.newPathnames.splice(index, 1);
          }

          console.log(`New tagged post created from "${newPathname}"...`);
          console.log(`New posts still remaining: ${ig.newPathnames.length}`);
        })
      await page.close();
    }
  },

  updateTaggedPosts: async () => {
    // TO DO: FETCH WIDER SELECTION FROM SERVER
    serverState = await ig.fetchServerState();
    console.log('Checking and updating likes of wider selection...');

    for (const taggedPost of serverState) {
      const page = await ig.browser.newPage();
      await page.goto(`${config.INSTA_BASE_URL}${taggedPost.pathname}`, { waitUntil: 'networkidle2' });
      await page.waitFor(2000);

      const body = await page.evaluate(() => {
        const fetchLikes = () => {
          // If image is loaded => "LIKES"
          // If likes div is present
          const imageDiv = document.querySelector('.Nm9Fw');
          if (imageDiv) {
            if (document.querySelector('.Nm9Fw button span')) {
              return document.querySelector('.Nm9Fw button span').innerText.replace(/,/g, "");
            }
            if (document.querySelector('.Nm9Fw button').innerText === 'like this') {
              return 0;
            }
            // IF "Liked by Mario Testino and 1 other"
            if (document.querySelector('.Nm9Fw button')) {
              let number = document.querySelector('.Nm9Fw button').innerText.match(/\d/g).join();
              return parseInt(number) + 1;
            }
          }

          // If video is loaded => "VIEWS"
          if (document.querySelector('.HbPOm')) {
            if (document.querySelector('.HbPOm span span')) {
              return document.querySelector('.HbPOm span span').innerText.replace(/,/g, "");
            }
          }
        };

        return {
          likes: parseInt(fetchLikes())
        }
      })

      body["pathname"] = taggedPost.pathname;

      const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/${ig.SUBJECT}`;
      serverState = await fetch(endpoint, {
          method: 'patch',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => data)

      await page.close();
    }
  }
};

// PRIVATE HELPER FUNCTIONS
const scrollDown = async () => {
  await ig.page.evaluate(() => {
    const randomNumber = Math.random() * 3;
    window.scrollBy(0, window.innerHeight * randomNumber);
  });
};

module.exports = ig;
