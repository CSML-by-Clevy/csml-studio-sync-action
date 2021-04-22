const core = require('@actions/core');
const github = require('@actions/github');
const { BotsService } = require('./bots.service');

(async () => {
  try {
    const payload = github.context.payload;
    if (payload) console.log('this is the payload: ', payload);
    else console.log('no payload, github context: ', github.context);
    if (process.env.INPUT_SAVE) await BotsService.saveBot();
    if (process.env.INPUT_BUILD) await BotsService.buildBot();
    if (process.env.INPUT_CREATE_LABEL) {
      const payload = github.context.payload;
      const label_name = payload.ref.replace('refs/tags/', '');
      await BotsService.createLabel(label_name);
    }
    if (process.env.INPUT_DELETE_LABEL) {
      const payload = github.context.payload;
      const label_name = payload.ref.replace('refs/tags/', '');
      await BotsService.deleteLabel(label_name);
    }
  }
  catch (err) {
    core.setFailed(err.message);
  }
})();