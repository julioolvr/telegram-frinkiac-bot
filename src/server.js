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
    rollbar.reportMessage('Waiting for next response...', 'debug');

    telegramClient.getUpdates().then(messages => {
      rollbar.reportMessageWithPayloadData(`Responding to updates`, {
        level: 'debug',
        custom: {
          updatesCount: messages.length
        }
      });

      messages.forEach(message => bot.respondTo(message));
      this.waitForNextResponse();
    }).catch(error => {
      rollbar.reportMessageWithPayloadData('Error getting updates', {
        custom: {
          message: error.toString()
        }
      });
    });
  }
}

export default App;
