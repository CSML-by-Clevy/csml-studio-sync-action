const fs = require('fs');
const request = require('superagent');
const crypto = require('crypto');
const Promise = require('bluebird');

const {
  CSML_CLIENT_API_KEY,
  CSML_CLIENT_API_SECRET,
  CSML_CLIENT_URL = 'https://clients.csml.dev/v1',
  DEBUG,
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
      console.log('Getting airules.json...')
      let airules = (fs.existsSync('airules.json'))
        ? JSON.parse(fs.readFileSync('airules.json'))
        : [];
      if (DEBUG) console.log({ airules });
      console.log(`Got ${airules.length} airules.`)
      return airules;
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
    console.log('Getting repository flows...')
    const flows = [];
    if (fs.existsSync('flows')) {
      fs.readdirSync('flows')
      .forEach((fileName) => {
        if (fileName.endsWith('.csml')) f{
          flows.push(fs.readFileSync(`flows/${fileName}`).toString());
        }
      });
    }
      if (DEBUG) console.log(flows);
      console.log(`Got ${flows.length} repository flows.`)
    return flows;
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
      .send()
      .catch(err => {
        if (DEBUG) console.error(err);
        throw err;
      });
    console.log('Successfully built bot');
  }

  /**
   * Sync the flows and airule from the repository to the csml studio.
   */
  static async updateBot() {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    const flows = await BotsService.getRepoFlows();
    const airules = await BotsService.getRepoAirules();

    console.log('Getting CSML Studio flows...')
    const studioBotFlows = await request.get(`${CSML_CLIENT_URL}/api/bot/flows`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .then(res => res.body);
    console.log(`Got ${studioBotFlows.length} CSML Studio flows.`)

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

    console.log(`Deleting ${deleteFlows.length} removed flows...`)
    if (deleteFlows.length) {
      await Promise.each(deleteFlows, async df => {
        await request.del(`${CSML_CLIENT_URL}/api/bot/flows/${df.id}`)
        .set('X-Api-Key', XApiKey)
        .set('X-Api-Signature', XApiSignature)
        .send(df)
        .catch(err => {
          if (DEBUG) console.error(df, err);
          throw err;
        });
      });
      console.log('Deleted flows.');
    }

    console.log(`Updating ${updateFlows.length} flows...`)
    if (updateFlows.length) {
      await Promise.each(updateFlows, async uf => {
        await request.put(`${CSML_CLIENT_URL}/api/bot/flows/${uf.id}`)
        .set('X-Api-Key', XApiKey)
        .set('X-Api-Signature', XApiSignature)
        .send(uf)
        .catch(err => {
          if (DEBUG) console.error(uf, err);
          throw err;
        });
      });
      console.log('Updated flows.');
    }

    console.log(`Creating ${createFlows.length} new flows...`)
    if (createFlows.length) {
      await Promise.each(createFlows, async cf => {
        await request.post(`${CSML_CLIENT_URL}/api/bot/flows`)
          .set('X-Api-Key', XApiKey)
          .set('X-Api-Signature', XApiSignature)
          .send(cf)
          .catch(err => {
            if (DEBUG) console.error(cf, err);
            throw err;
          });
      });
      console.log('Created flows.');
    }

    if (airules) {
      console.log('Updating airules...')
      await request.put(`${CSML_CLIENT_URL}/api/bot`)
        .set('X-Api-Key', XApiKey)
        .set('X-Api-Signature', XApiSignature)
        .send({ airules })
        .catch(err => {
          if (DEBUG) console.error({ airules }, err);
          throw err;
        });
      console.log('Updated airules.')
    }
  }

  /**
   * Create a new snapshot
   *
   * @param {string} snapshotName
   */
  static async createSnapshot(snapshotName) {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    console.log(`Creating snapshot ${snapshotName}...`);
    return request.post(`${CSML_CLIENT_URL}/api/bot/label`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .send({ label: snapshotName })
      .then(res => res.body)
      .catch(err => {
        if (DEBUG) console.error(err);
        throw err;
      });
      console.log(`Successfully created bot snapshot ${snapshotName}.`);
    }

  /**
   * Delete an existing snapshot
   *
   * @param {string} snapshotName
   */
  static async deleteSnapshot(snapshotName) {
    const [XApiKey, XApiSignature] = BotsService.setAuthenticationHeader();

    console.log(`Deleting snapshot ${snapshotName}...`);
    return request.del(`${CSML_CLIENT_URL}/api/bot/label/${snapshotName}`)
      .set('X-Api-Key', XApiKey)
      .set('X-Api-Signature', XApiSignature)
      .then(res => res.body)
      .catch(err => {
        if (DEBUG) console.error(err);
        throw err;
      });
      console.log(`Successfully deleted bot snapshot ${snapshotName}.`);
  }
}

module.exports = { BotsService };
