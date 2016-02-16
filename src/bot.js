import TelegramClient from './services/telegramClient';

/**
 * @class Bot to respond to messages from Telegram users.
 */
export default class {
  constructor({ client = new TelegramClient(process.env.BOT_TOKEN) } = {}) {
    this.client = client;
  }

  respondTo(message) {
    // TODO: Respond!
  }
}
