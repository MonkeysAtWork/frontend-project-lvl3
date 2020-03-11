import axios from 'axios';


test('test site working', () => axios.get('https://rss-aggregator.now.sh/')
  .then(response => expect(response.status).toEqual(200)));
