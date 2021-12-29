const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const config = require('./config');

const igTaggedPosts = {
  SUBJECT: config.INSTAGRAM_ACCOUNT,
  browser: null,
  page: null,
  serverState: null,
  mostRecentPathname: null,
  newPathnames: null,

  fetchServerState: async () => {
    const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/${igTaggedPosts.SUBJECT}`;
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
      console.log(`mostRecentPathname set: "${igTaggedPosts.mostRecentPathname}"...`);
    }
  },

  initialize: async () => {
    // Detect which devise is scraping: 'MAC' or 'RASP'
    let options = null;
    if (config.DEVISE === 'MAC') {
      options = {
        args: ['--disable-dev-shm-usage'],
        headless: false
      }
    }
    if (config.DEVISE === 'RASP') {
      options = {
        executablePath: '/usr/bin/chromium-browser',
        headless: false
      }
    }
    igTaggedPosts.browser = await puppeteer.launch(options);
    igTaggedPosts.page = await igTaggedPosts.browser.newPage();
    console.log('Initialized...');
  },

  openHomepage: async() => {
    await igTaggedPosts.page.goto(config.INSTA_BASE_URL, { waitUntil: 'networkidle2' });
    await igTaggedPosts.page.waitFor(1000);
    console.log('Homepage opened...');
  },

  acceptCookies: async() => {
    await igTaggedPosts.page.evaluate(() => {
      const presentationOverlay = document.getElementsByClassName('RnEpo')[0];
      const acceptButton = presentationOverlay.getElementsByClassName('bIiDR')[0];
      acceptButton.click();
    });
    console.log('Cookies accepted...');
  },

  login: async (username, password) => {
    await igTaggedPosts.page.type('input[name="username"]', username, { delay: 100 });
    await igTaggedPosts.page.type('input[name="password"]', password, { delay: 100 });

    let loginButton = await igTaggedPosts.page.$$('button[type="submit"]');
    await loginButton[0].click();
    await igTaggedPosts.page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in...');
  },

  gotToSubjectTaggedPage: async () => {
    igTaggedPosts.page = await igTaggedPosts.browser.newPage();
    await igTaggedPosts.page.goto(`${config.INSTA_BASE_URL}/${igTaggedPosts.SUBJECT}/tagged`, { waitUntil: 'networkidle2' });
    console.log('Tagged page loaded...');
  },

  fetchPostsUrls: async () => {
    console.log('Fetching post urls...');

    let loadedPathnames = [];
    let pathnamesCollection = [];

    async function fetchLoadedPathnames() {
      await igTaggedPosts.page.waitFor(5000);

      loadedPathnames = await igTaggedPosts.page.evaluate(() => {
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
      if (pathnamesCollection.length <= config.POSTS_COUNT) {
        addLoadedPathnamesToCollection();
        await scrollDown();
        await fetchLoadedPathnames();
      } else {
        addLoadedPathnamesToCollection();
        console.log(`Number of posts waiting to be posted: ${pathnamesCollection.length}`);
        igTaggedPosts.newPathnames = pathnamesCollection;
        await igTaggedPosts.page.close();
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

  sendTaggedPosts: async () => {
    if (igTaggedPosts.newPathnames.length > 0) {
      console.log('Creating new tagged posts...');
    }
    if (igTaggedPosts.newPathnames.length === 0) {
      console.log('No new tagged posts to be created...');
    }
    const newPathnamesCopy = igTaggedPosts.newPathnames.slice().reverse();

    for (const newPathname of newPathnamesCopy) {
      const page = await igTaggedPosts.browser.newPage();
      await page.goto(`${config.INSTA_BASE_URL}${newPathname}`, { waitUntil: 'networkidle2' });
      await page.waitFor(4000);

      const taggedPost = await page.evaluate(() => {
        const imageDiv = document.querySelector('.Nm9Fw');
        const videoDiv = document.querySelector('.HbPOm');

        // This function needs to be externalized since being reused in updateLikes()
        const fetchLikes = () => {
          // If image is loaded => "LIKES"
          if (imageDiv) {
            if (document.querySelector('.Nm9Fw a span')) {
              return document.querySelector('.Nm9Fw a span').innerText.replace(/,/g, "");
            }
            if (document.querySelector('.Nm9Fw a').innerText === 'like this') {
              return 0;
            }
            // If "Liked by Mario Testino and 1 other"
            if (document.querySelector('.Nm9Fw a').innerText.match(/\d/g)) {
              let number = document.querySelector('.Nm9Fw a').innerText.match(/\d/g).join();
              return parseInt(number) + 1;
            }

            // TODO: If likes are hidden - dig deeper...
            if (document.querySelector('.Nm9Fw .zV_Nj')) {
              return Math.floor(Math.random() * 2000);

              // const others = document.querySelector('.Nm9Fw .zV_Nj');
              // others.click();
            }
          }

          // If video is loaded => "VIEWS"
          if (videoDiv) {
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
          // TO DO: If image carousel?
          console.log("Problem with fetching image url...");
        }

        // If post still exists...
        if (imageDiv || videoDiv) {
          return {
            post_type: "tagged",
            author: document.querySelector('.sqdOP._8A5w5.ZIAjV').innerText,
            message: document.querySelector('.C4VMK') ? document.querySelector('.C4VMK').children[1].innerHTML.replace(/"/g, "'") : "",
            posted_at: document.querySelector("._1o9PC").attributes["datetime"].value,
            pathname: window.location.pathname,
            image_url: fetchImgUrl(),
            user_avatar_url: document.querySelector('._6q-tv').src,
            likes: parseInt(fetchLikes())
          };
        }
        return null;
      });

      if (taggedPost) {
        const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/${igTaggedPosts.SUBJECT}`;

        fetch(endpoint, {
            method: 'post',
            body: JSON.stringify(taggedPost),
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then((data) => {
            serverState = data;

            // Delete this pathname from 'newPathnames' array in module state
            const index = igTaggedPosts.newPathnames.indexOf(newPathname);
            if (index > -1) {
              igTaggedPosts.newPathnames.splice(index, 1);
            }

            console.log(`New tagged post created from "${newPathname}"...`);
            console.log(`New posts still remaining: ${igTaggedPosts.newPathnames.length}`);
          })
      }
      await page.close();
    }
  },

  updateTaggedPosts: async () => {
    console.log('Checking and updating likes of wider selection...');
    // TO DO: FETCH WIDER SELECTION FROM SERVER
    serverState = await igTaggedPosts.fetchServerState();

    for (const taggedPost of serverState) {
      const page = await igTaggedPosts.browser.newPage();
      await page.goto(`${config.INSTA_BASE_URL}${taggedPost.pathname}`, { waitUntil: 'networkidle2' });
      await page.waitFor(2000);

      const body = await page.evaluate((pathname) => {
        // If post has been deleted
        if (document.querySelector('.MCXLF')) {
          return {
            pathname: pathname,
            status: 'deleted'
          }
        }

        // If post still exists
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
              return (parseInt(number) + 1);
            }

            // TODO: If likes are hidden - dig deeper...
            if (document.querySelector('.Nm9Fw .zV_Nj')) {
              return Math.floor(Math.random() * 2000);

              // const others = document.querySelector('.Nm9Fw .zV_Nj');
              // others.click();
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
          pathname: pathname,
          status: 'live',
          likes: parseInt(fetchLikes())
        }
      }, taggedPost.pathname);

      // TO DO: THIS NEEDS PATHNAME TO FIND POST IN DB
      if (body.status === 'live') {
        const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/update_likes`;
        serverState = await fetch(endpoint, {
            method: 'patch',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => data)
      }

      if (body.status === 'deleted') {
        const endpoint = `${config.API_BASE_URL}/api/v1/tagged_posts/${igTaggedPosts.SUBJECT}/?pathname=${body.pathname}`;
        serverState = await fetch(endpoint, {
            method: 'delete',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => data)
      }

      await page.close();
    }
  }
};

// PRIVATE HELPER FUNCTIONS
const scrollDown = async () => {
  await igTaggedPosts.page.evaluate(() => {
    const randomNumber = Math.random() * 3;
    window.scrollBy(0, window.innerHeight * randomNumber);
  });
};

module.exports = igTaggedPosts;
