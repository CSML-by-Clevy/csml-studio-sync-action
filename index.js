const core = require('@actions/core');
const github = require('@actions/github');
const { BotService } = require('./bots.service');

(async () => {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow.
    const payload = JSON.stringify(github.context.payload, undefined, 2);

    // Retrieve the params passed through the workflow yml file.
    if (process.env.INPUT_SAVE) await BotService.saveBot();
    if (process.env.INPUT_BUILD) await BotService.buildBot();
    if (process.env.INPUT_CREATE_LABEL) {
      const payload = JSON.stringify(github.context.payload, undefined, 2);
      const label_name = payload.ref.replace('refs/tags/', '');
      await BotService.createLabel(label_name);
    }
    if (process.env.INPUT_DELETE_LABEL) {
      const payload = JSON.stringify(github.context.payload, undefined, 2);
      const label_name = payload.ref.replace('refs/tags/', '');
      await BotService.deleteLabel(label_name);
    }
  }
  catch (err) {
    core.setFailed(err.message);
  }
})();