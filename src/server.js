import Bot from './bot';
import TelegramClient from 'node-telegram-bot-api';
import rollbar from 'rollbar';

class App {
  start() {
    const telegramClient = new TelegramClient(process.env.BOT_TOKEN, { polling: true });
    const bot = new Bot(telegramClient);

    telegramClient.on('message', message => {
      bot.respondToMessage(message);
    });

    telegramClient.on('inline_query', message => {
      bot.respondToInlineQuery(message);
    });
  }
}

export default App;
