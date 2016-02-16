import TelegramClient from './services/telegramClient';
import FrinkiacApi from './services/frinkiacApi';

const frinkiacApi = new FrinkiacApi();

// From http://stackoverflow.com/a/105074, just something to test for the time being.
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

/**
 * @class Bot to respond to messages from Telegram users.
 */
export default class {
  constructor({ client = new TelegramClient(process.env.BOT_TOKEN) } = {}) {
    this.client = client;
  }

  respondTo(update) {
    if (update.message) {
      let message = update.message;

      if (message.text && message.text.startsWith('/start')) {
        this.client.sendText('oh hi', message.chat.id);
      }
    } else if (update.inline_query) {
      frinkiacApi.search(update.inline_query.query).then(results => {
        return results.map(url => {
          return {
            type: 'photo',
            id: guid(),
            photo_url: url,
            thumb_url: url // TODO: Maybe we can get thumbnails?
          };
        });
      }).then(queryResults => {
        return this.client.answerInlineQuery(update.inline_query.id, queryResults)
      });
    }
  }
}
