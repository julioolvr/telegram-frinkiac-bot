import got from 'got';

/**
 * @class Client to communicate with Telegram's API.
 */
export default class {
  /**
   * @param {string} token Token for the bot provided by Telegram.
   */
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  /**
   * Sends a text message to the given chatId.
   * @param  {string} text   Text to send on the message.
   * @param  {number} chatId Id of the chat to send the message to.
   * @return {Promise}       A promise for the request to Telegram's API.
   */
  sendText(text, chatId) {
    return got.post(`${this.baseUrl}/sendMessage`, { body: { text: text, chat_id: chatId } });
  }

  /**
   * Long-polls Telegram's API to get new messages. It will remember the latest update and
   * query starting from the next one on subsequent calls.
   * @return {Promise} A promise for the request to Telegram's API, converting updates to messages.
   */
  getUpdates() {
    let options = { timeout: 60 };

    if (this.lastOffset !== undefined) {
      options.offset = this.lastOffset + 1;
    }

    console.log(`TelegramClient#getUpdates, offset: ${options.offset}, url: ${this.baseUrl}/getUpdates`);
    return got.get(`${this.baseUrl}/getUpdates`, { query: options })
      .then(response => JSON.parse(response.body).result)
      .then(updates => {
        if (updates.length === 0) {
          return [];
        }

        let ids = updates.map(update => update.update_id);
        this.lastOffset = Math.max(...ids);
        return updates;
      })
      .catch(error => {
        console.error(`Error while trying to get updates: ${error}`);
        return [];
      });
  }

  /**
   * Responds to an inline query made to the bot.
   * @param  {number} queryId Id of the inline query being answered.
   * @param  {array}  results An array of `InlineQueryResult`s supported by Telegram: https://core.telegram.org/bots/api#inlinequeryresult
   * @return {Promise}        A promise for the response from the API.
   */
  answerInlineQuery(queryId, results) {
    console.log(`TelegramClient#answerInlineQuery, id: ${queryId}`);
    return got.post(`${this.baseUrl}/answerInlineQuery`, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inline_query_id: queryId,
        results: results
      })
    }).catch(error => console.log(error));
  }
}
