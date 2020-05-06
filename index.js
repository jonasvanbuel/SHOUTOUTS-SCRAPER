import Scraper from 'instagram_scraper';
import Server from 'server_interface';

import { fetchCurrentState } from 'server_interface';

const InitialState = []

fetchCurrentState();

(async () => {
  await Scraper.initialize();
  await Scraper.login('socialdeckone', 'socialdeck1');
  await Scraper.getTaggedLinks('mariotestino');
})();
