import got from 'got';
import btoa from 'btoa';
import Bluebird from 'bluebird';
import _ from 'lodash';

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

  searchScenes(query) {
    return this.search(query)
      .then(results => results.map(result => this.requestUrl(`${this.baseUrl}/api/caption?e=${result.Episode}&t=${result.Timestamp}`)))
      .then(Bluebird.all)
      .then(responses => responses.map(response => response.Subtitles))
      .then(_.flatten)
      .then(scenes => _.uniqBy(scenes, 'Id'));

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

  gifUrlFor(scene, caption) {
    let url = `${this.baseUrl}/gif/${scene.Episode}/${scene.StartTimestamp}/${scene.EndTimestamp}.gif`;

    if (caption) {
      url = `${url}?b64lines=${btoa(caption)}`;
    }

    return url;
  }
}
