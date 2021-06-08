const core = require('@actions/core');
const github = require('@actions/github');
const { BotsService } = require('./bots.service');

const {
  INPUT_UPDATE,
  INPUT_BUILD,
  INPUT_CREATE_SNAPSHOT,
  INPUT_DELETE_SNAPSHOT,
} = process.env;

(async () => {
  try {
    const payload = github.context.payload;

    if (INPUT_UPDATE) await BotsService.updateBot();

    if (INPUT_BUILD) await BotsService.buildBot();

    if (INPUT_CREATE_SNAPSHOT) {
      const payload = github.context.payload;
      const snapshotName = payload.ref.replace('refs/tags/', '');
      await BotsService.createSnapshot(snapshotName);
    }

    if (INPUT_DELETE_SNAPSHOT) {
      const payload = github.context.payload;
      const snapshotName = payload.ref.replace('refs/tags/', '');
      await BotsService.deleteSnapshot(snapshotName);
    }

  }
  catch (err) {
    core.setFailed(err.message);
  }
})();
