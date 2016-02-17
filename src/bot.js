import TelegramClient from './services/telegramClient';
import FrinkiacApi from './services/frinkiacApi';

const frinkiacApi = new FrinkiacApi();
const SCREENSHOT_HEIGHT = 480;
const SCREENSHOT_WIDTH = 640;

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

      if (!message.text) {
        return;
      }

      if (message.text.startsWith('/start')) {
        const startMessage = 'Use this bot inline to search a Simpson screenshot on frinkiac.com.\n' +
                             'For example: @FrinkiacSearchBot d\'oh';

        this.client.sendText(startMessage, message.chat.id);
      }

      if (message.text.startsWith('/help')) {
        const helpMessage = 'This is an inline bot. This means that you can use it on any chat, private or group, without ' +
                            'inviting it. Just type "@FrinkiacSearchBot <your search>" and wait. The bot will show you some ' +
                            'screenshots matching your query, and you can select one of them. Try it here! Just make sure to ' +
                            'add "@FrinkiacSearchBot" at the beginning of your message.'

        this.client.sendText(helpMessage, message.chat.id);
      }
    } else if (update.inline_query) {
      if (!update.inline_query.query) {
        return;
      }

      let queryParts = update.inline_query.query.split('/').map(s => s.trim());
      let query = queryParts[0];
      let caption = queryParts[1];

      frinkiacApi.search(query).then(results => {
        return results.map(result => {
          let photoUrl = caption ? frinkiacApi.memeUrlFor(result, caption) : frinkiacApi.urlFor(result);

          return {
            type: 'photo',
            id: guid(),
            photo_url: photoUrl,
            thumb_url: frinkiacApi.thumbnailUrlFor(result),
            photo_width: SCREENSHOT_WIDTH,
            photo_height: SCREENSHOT_HEIGHT
          };
        });
      }).then(queryResults => {
        return this.client.answerInlineQuery(update.inline_query.id, queryResults)
      });
    }
  }
}
