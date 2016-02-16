import got from 'got';

export default class {
  constructor() {
    this.baseUrl = 'http://frinkiac.com';
  }

  search(query) {
    return got(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`)
      .then(response => response.body)
      .then(JSON.parse)
      .then(results => {
        return results.map(result => {
          return {
            full: this.urlFor(result),
            thumbnail: this.thumbnailUrlFor(result)
          };
        });
      });
  }

  urlFor(result) {
    return `${this.baseUrl}/img/${result.Episode}/${result.Timestamp}.jpg`;
  }

  thumbnailUrlFor(result) {
    return `${this.baseUrl}/img/${result.Episode}/${result.Timestamp}/small.jpg`;
  }
}
