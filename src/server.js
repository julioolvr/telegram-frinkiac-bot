import Bot from './bot';
import TelegramClient from './services/telegramClient';
import rollbar from 'rollbar';

const bot = new Bot();
const telegramClient = new TelegramClient(process.env.BOT_TOKEN);

class App {
  start() {
    this.waitForNextResponse();
  }

  waitForNextResponse() {
    console.log('Waiting for next response...');

    telegramClient.getUpdates().then(messages => {
      console.log(`Responding to ${messages.length} updates`);
      messages.forEach(message => bot.respondTo(message));
    }).catch(error => {
      rollbar.reportMessageWithPayloadData('Error getting updates', {
        custom: {
          message: error.toString()
        }
      });
    }).finally(() => this.waitForNextResponse());
  }
}

export default App;
