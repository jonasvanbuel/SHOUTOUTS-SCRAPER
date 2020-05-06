const fetch = require('node-fetch');
const instagram = require('./instagram');

// FETCH INITIAL SERVER STATE
let serverState = [];
function fetchServerState() {
  const BASE_URL = 'http://localhost:3000';
  const SUBJECT_USERNAME = 'mariotestino';
  const endpoint = `${BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;
  fetch(endpoint)
    .then(response => response.json())
    .then((data) => {
      serverState = data;
      console.log(`serverstate updated...`);
      console.log(serverState);
    })
};
fetchServerState();

// INSTAGRAM SCRAPING
(async () => {
  await instagram.initialize();
  await instagram.login('socialdeckone', 'socialdeck1');
  await instagram.getTaggedLinks('mariotestino');
})();
