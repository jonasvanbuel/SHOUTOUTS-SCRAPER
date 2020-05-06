


const BASE_URL = 'http://localhost:3000';
const SUBJECT_USERNAME = 'mariotestino';

async function fetchState() {
  const endpoint = `${BASE_URL}/api/v1/tagged_posts/${SUBJECT_USERNAME}`;
  fetch(endpoint)
    .then(response => response.json())
    .then((data) => {
      console.log(data);
    })
}

module.exports.fetchState = fetchState;
