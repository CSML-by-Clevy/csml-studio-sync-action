const fs = require('fs');
const request = require('superagent');
const crypto = require('crypto');
const Promise = require('bluebird');

const {
  CSML_CLIENT_API_KEY,
  CSML_CLIENT_API_SECRET,
  CSML_CLIENT_URL = 'https://clients.csml.dev/v1',
} = process.env;

class BotsService {
  /**
   * Get airules of a bot
   *
   * @async
   * @returns array
   */
  static async getRepoAirules() {
    try {
      if (fs.existsSync('airules.json')) return JSON.parse(fs.readFileSync('airules.json'));
      return [];
    }
    catch (err) {
      console.warn("Invalid airules.json file.")
      return []
    }
  }

  /**
   * Get flows of a bot
   * @async
   * @returns array
   */
  static async getRepoFlows() {
    if (fs.existsSync('flows')) {
      return fs.readdirSync('flows')
        .reduce((acc, fileName) => {
          if (fileName.endsWith('.csml')) acc.push(fs.readFileSync(`flows/${fileName}`).toString());
          return acc;
        }, []);
    }
    return [];
  }

  /**
   * Create the signature to authentify call towards csml client's api
   *
   * @returns array
   */
  static setAuthenticationHeader() {
    const UNIX_TIMESTAMP = Math.floor(Date.now() / 1000);
    const XApiKey = `${CSML_CLIENT_API_KEY}|${UNIX_TIMESTAMP}`;
    const signature = crypto.createHmac('sha256', CSML_CLIENT_API_SECRET)
      .update(XApiKey, 'utf-8')
      .digest('hex');
    const XApiSignature = `sha256=${signature}`;
    return [XApiKey, XApiSignature];
  }

  /**
   * Build the bot via the studio client API
   */
  static async buildBot() {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    await request.post(`${CSML_CLIENT_URL}/api/bot/build`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .send();
  }

  /**
   * Sync the flows and airule from the repository to the csml studio.
   */
  static async updateBot() {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    const flows = await BotsService.getRepoFlows();
    const airules = await BotsService.getRepoAirules();

    const studioBotFlows = await request.get(`${CSML_CLIENT_URL}/api/bot/flows`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .then(res => res.body);

    const deleteFlows = [];
    const updateFlows = [];
    const createFlows = [];

    studioBotFlows.forEach(studioFlow => {
      const found = flows.find(f => f.name === studioFlow.name);
      if (found) updateFlows.push({ ...studioFlow, ...found });
      else deleteFlows.push(studioFlow);
    });

    flows.forEach(f => {
      const found = studioBotFlows.find(sf => sf.name === f.name);
      if (!found) createFlows.push(f);
    })

    if (deleteFlows.length) {
      await Promise.each(deleteFlows, async df => {
        await request.del(`${CSML_CLIENT_URL}/api/bot/flows/${df.id}`)
          .set('X-Api-Key', XApiKey)
          .set('X-Api-Signature', XApiSignature)
          .send(df);
      });
    }

    if (updateFlows.length) {
      await Promise.each(updateFlows, async uf => {
        await request.put(`${CSML_CLIENT_URL}/api/bot/flows/${uf.id}`)
          .set('X-Api-Key', XApiKey)
          .set('X-Api-Signature', XApiSignature)
          .send(uf);
      });
    }

    if (createFlows.length) {
      await Promise.each(createFlows, async cf => {
        await request.post(`${CSML_CLIENT_URL}/api/bot/flows`)
          .set('X-Api-Key', XApiKey)
          .set('X-Api-Signature', XApiSignature)
          .send(cf);
      });
    }

    if (airules) {
      await request.put(`${CSML_CLIENT_URL}/api/bot`)
        .set('X-Api-Key', XApiKey)
        .set('X-Api-Signature', XApiSignature)
        .send({ airules });
    }
  }

  /**
   * Create a new snapshot
   *
   * @param {string} snapshotName
   */
  static async createSnapshot(snapshotName) {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    return request.post(`${CSML_CLIENT_URL}/api/bot/label`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .send({ label: snapshotName })
      .then(res => res.body);
  }

  /**
   * Delete an existing snapshot
   *
   * @param {string} snapshotName
   */
  static async deleteSnapshot(snapshotName) {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    return request.del(`${CSML_CLIENT_URL}/api/bot/label/${snapshotName}`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .then(res => res.body);
  }
}

module.exports = { BotsService };
