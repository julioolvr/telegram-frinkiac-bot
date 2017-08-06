import TelegramClient from 'node-telegram-bot-api';
import FrinkiacApi from './services/frinkiacApi';
import Bluebird from 'bluebird';
import rollbar from 'rollbar';
import config from './config';

const frinkiacApi = new FrinkiacApi();
const SCREENSHOT_HEIGHT = config.screenshotHeight;
const SCREENSHOT_WIDTH = config.screenshotWidth;
const GIF_WIDTH = config.gifWidth;
const GIF_HEIGHT = config.gifHeight;
const MAX_RESULTS = 50;
const EM_WIDTH = 15; // Amount of M letters that fit in a single line.

function photoId(photoResult) {
  return [photoResult.Episode, photoResult.Timestamp].join('-');
}

function gifId(gifResult) {
  return [gifResult.Episode, gifResult.StartTimestamp, gifResult.EndTimestamp].join('-');
}

/**
 * Splits the caption in case it's needed and the user didn't split it manually.
 * @param  {string} caption The caption as provided by the user.
 * @return {string}         The caption splitted into several lines.
 */
function splitCaption(caption) {
  if (!caption) {
    return;
  }

  if (caption.includes('\n')) {
    // The user separated the caption into several lines on purpose, let's respect that.
    return caption;
  }

  let words = caption.split(' ').filter(s => s);
  let lines = [[]];
  let currentLine = 0;

  words.forEach(word => {
    let currentLineLength = lines[currentLine].reduce((acc, w) => acc + w.length, 0);

    if (currentLineLength + word.length > EM_WIDTH) { // Ignoring spaces on purpose - they shouldn't matter unless in a line full of M's
      currentLine++;
      lines[currentLine] = [word];
    } else {
      lines[currentLine].push(word);
    }
  });

  return lines.map(line => line.join(' ')).join('\n');
}

/**
 * @class Bot to respond to messages from Telegram users.
 */
export default class {
  constructor(client) {
    this.client = client;
  }

  respondToMessage(message) {
    if (!message.text) {
      return;
    }

    if (message.text.startsWith('/start')) {
      const startMessage = config.messages.start;

      this.client.sendMessage(message.chat.id, startMessage);
    }

    if (message.text.startsWith('/help')) {
      const helpMessage = config.messages.help;

      this.client.sendMessage(message.chat.id, helpMessage);
    }
  }

  respondToInlineQuery(inlineQuery) {
    if (!inlineQuery.query) {
      return;
    }

    let queryParts = inlineQuery.query.split('/').map(s => s.trim());
    let query = queryParts[0];
    let caption = splitCaption(queryParts[1]);
    let response;

    if (query.startsWith('gif ')) {
      response = this.respondWithGif(query.replace(/^gif/, '').trim(), caption);
    } else {
      response = this.respondWithImage(query, caption);
    }

    response.then(queryResults => {
      return this.client.answerInlineQuery(inlineQuery.id, queryResults.slice(0, MAX_RESULTS));
    });
  }

  respondWithImage(query, caption) {
    return frinkiacApi.search(query).then(results => {
      return results.map(result => {
        let photoUrl = caption ? frinkiacApi.memeUrlFor(result, caption) : frinkiacApi.urlFor(result);

        return {
          type: 'photo',
          id: photoId(result),
          photo_url: photoUrl,
          thumb_url: frinkiacApi.thumbnailUrlFor(result),
          photo_width: SCREENSHOT_WIDTH,
          photo_height: SCREENSHOT_HEIGHT
        };
      });
    });
  }

  respondWithGif(query, caption) {
    return frinkiacApi.searchScenes(query).then(scenes => {
      return scenes.map(scene => {
        return {
          type: 'gif',
          id: gifId(scene),
          gif_url: frinkiacApi.gifUrlFor(scene, caption),
          thumb_url: frinkiacApi.thumbnailUrlFor({ Episode: scene.Episode, Timestamp: scene.RepresentativeTimestamp }),
          gif_width: GIF_WIDTH,
          gif_height: GIF_HEIGHT
        };
      });
    }).catch(error => {
      rollbar.reportMessage('Error responding with gif', {
        custom: {
          message: error
        }
      });
    });
  }
}
