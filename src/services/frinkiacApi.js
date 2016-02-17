import got from 'got';

export default class {
  constructor() {
    this.baseUrl = 'https://frinkiac.com';
  }

  search(query) {
    return got(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`)
      .then(response => response.body)
      .then(JSON.parse);
  }

  memeUrlFor(result, caption) {
    return `${this.baseUrl}/meme/${result.Episode}/${result.Timestamp}.jpg?lines=${encodeURIComponent(caption)}`;
  }

  urlFor(result) {
    return `${this.baseUrl}/img/${result.Episode}/${result.Timestamp}.jpg`;
  }

  thumbnailUrlFor(result) {
    return `${this.baseUrl}/img/${result.Episode}/${result.Timestamp}/small.jpg`;
  }
}
