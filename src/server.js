import Bot from './bot';
import TelegramClient from './services/telegramClient';

const bot = new Bot();
const telegramClient = new TelegramClient(process.env.BOT_TOKEN);

class App {
  start() {
    this.waitForNextResponse();
  }

  waitForNextResponse() {
    telegramClient.getUpdates().then(messages => {
      messages.forEach(message => bot.respondTo(message));
      this.waitForNextResponse();
    });
  }
}

export default App;
