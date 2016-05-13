import got from 'got';
import btoa from 'btoa';

export default class {
  constructor() {
    this.baseUrl = 'https://frinkiac.com';
  }

  requestUrl(url) {
    return got(url)
      .then(response => response.body)
      .then(JSON.parse)
      .catch(error => console.error('Error in request to Frinkiac API', error.response.body));
  }

  search(query) {
    return this.requestUrl(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`);
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

  gifUrlsFor(result, caption) {
    // TODO: result could have been already queried by a previous result, how do I avoid querying again?
    return this.requestUrl(`${this.baseUrl}/api/caption?e=${result.Episode}&t=${result.Timestamp}`)
      .then(response => response.Subtitles)
      .then(subtitles => subtitles.map(subtitle => {
        let url = `${this.baseUrl}/gif/${result.Episode}/${subtitle.StartTimestamp}/${subtitle.EndTimestamp}.gif`;

        if (caption) {
          url = `${url}?b64lines=${btoa(caption)}`;
        }

        return url;
      }));
  }
}
