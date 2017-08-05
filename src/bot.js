import TelegramClient from 'node-telegram-bot-api';
import FrinkiacApi from './services/frinkiacApi';
import Bluebird from 'bluebird';
import rollbar from 'rollbar';

const frinkiacApi = new FrinkiacApi();
const SCREENSHOT_HEIGHT = process.env.FORMAT === 'HD' ? 1080 : 480;
const SCREENSHOT_WIDTH = process.env.FORMAT === 'HD' ? 1920 : 640;
const GIF_WIDTH = 480;
const GIF_HEIGHT = process.env.FORMAT === 'HD' ? 270 : 360;
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
      const startMessage = 'Use this bot inline to search a Simpson screenshot on frinkiac.com.\n' +
                           'For example: @FrinkiacSearchBot d\'oh';

      this.client.sendMessage(message.chat.id, startMessage);
    }

    if (message.text.startsWith('/help')) {
      const helpMessage = 'This is an inline bot. This means that you can use it on any chat, private or group, without ' +
                          'inviting it. Just type "@FrinkiacSearchBot <your search>" and wait. The bot will show you some ' +
                          'screenshots matching your query, and you can select one of them. Try it here! Just make sure to ' +
                          'add "@FrinkiacSearchBot" at the beginning of your message.\n\n' +
                          'You can generate "meme" images by adding your own subtitle to the image. To do this, write your ' +
                          'search query, and the text you want separated by a slash (/). For instance, "@FrinkiacSearchBot ' +
                          'drugs lisa / give me the drugs, lisa" and then pick one of the thumbnails. The image will be ' +
                          'generated with your text.\n\n' +
                          'You can send gifs by adding "gif" as the first word of your query. After that use it as always, ' +
                          'you can even add a caption for the gif. For instance "@FrinkiacSearchBot gif drugs lisa"';

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
