import got from 'got';

export default class {
  constructor() {
    this.baseUrl = 'http://frinkiac.com';
  }

  search(query) {
    return got(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`)
      .then(response => response.body)
      .then(JSON.parse)
      .then(results => results.map(result => this.urlFor(result)));
  }

  urlFor(result) {
    return `${this.baseUrl}/meme/${result.Episode}/${result.Timestamp}.jpg`;
  }
}
