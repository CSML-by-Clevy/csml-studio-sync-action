const core = require('@actions/core');
const github = require('@actions/github');
const { BotsService } = require('./bots.service');

(async () => {
  try {
    if (process.env.INPUT_SAVE) await BotsService.saveBot();
    if (process.env.INPUT_BUILD) await BotsService.buildBot();
    if (process.env.INPUT_CREATE_LABEL) {
      const payload = JSON.stringify(github.context.payload, undefined, 2);
      const label_name = payload.ref.replace('refs/tags/', '');
      await BotsService.createLabel(label_name);
    }
    if (process.env.INPUT_DELETE_LABEL) {
      const payload = JSON.stringify(github.context.payload, undefined, 2);
      const label_name = payload.ref.replace('refs/tags/', '');
      await BotsService.deleteLabel(label_name);
    }
  }
  catch (err) {
    core.setFailed(err.message);
  }
})();