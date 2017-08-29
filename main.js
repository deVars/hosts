'use strict';

const FS = require(`fs`),
      HTTP = require(`http`),
      UTILS = require(`./utils`);

function getHosts(config, setOfHosts) {
  const HOSTS = require(`./hosts`);
  let hostsRequested = HOSTS.length,
      hostsDone = 0

  HOSTS.forEach(host => {
    console.log(`processing ${host}. . .`);
    HTTP.get(UTILS.splitUrl(host), res => {
      let payload = [],
          lineEnding = undefined;

      res.on(`data`, chunk => payload += chunk);
      res.on(`end`, () => {
        lineEnding = lineEnding ||
          config.LINE_ENDINGS.find(
            ending => payload.lastIndexOf(ending) !== -1
          );
            
        let data = [];
        if (!lineEnding) {
          console.log(`Did not find proper line ending.`);
        } else {
          data = payload.split(lineEnding);
        }

        processHostEntries(config, setOfHosts, data);
        hostsDone++;
        if (hostsDone === hostsRequested) {
          prepareData(config, setOfHosts);
        }
      });
    }).on(`error`, e => {
      console.log(`Got error: ${e.message}`);
    });
  });
}

function processHostEntries(config, setOfHosts, entries) {
  entries.forEach(entry => {
    let matches = config.ENTRY_PATTERN.exec(entry),
        host = matches && matches[1] || undefined;
    if (host) {
      setOfHosts.add(host);
    }
  });
}

function prepareData(config, setOfHosts) {
  const CUSTOM_ENTRIES = require(`./customEntries`);

  CUSTOM_ENTRIES.forEach(entry => {
    setOfHosts.add(entry);
  });
  setOfHosts.delete(`localhost`);
  writeData(config, setOfHosts);
}

function writeData(config, setOfHosts) {
  const PATH = require(`path`),
        TEMPLATE = require(`./template`),
        OUTPUT_DIRECTORY = PATH.join(config.OUTPUT_DIRECTORY),
        OUTPUT_PATH = PATH.join(OUTPUT_DIRECTORY, config.OUTPUT_FILENAME);

  let dateToday = new Date(),
      finalData = Array.from(setOfHosts)
                    .map(entry => `${config.REDIRECT_TO_IP} ${entry}`),
      numUniqueHosts = finalData.length,
      finalDataString = finalData.join(config.OUTPUT_LINE_ENDING),
      dateString = `${UTILS.pad(dateToday.getUTCDate(), 2)}` +
                   `${UTILS.pad(dateToday.getUTCMonth() + 1, 2)}` +
                   `${dateToday.getUTCFullYear()}`;

  FS.access(OUTPUT_DIRECTORY, FS.F_OK | FS.R_OK | FS.W_OK, err => {
    if (err) {
      FS.mkdirSync(OUTPUT_DIRECTORY);
    }
    FS.writeFile(OUTPUT_PATH,
      TEMPLATE.get(dateString, finalDataString, numUniqueHosts),
      () => {
      console.log(`I am done. Number of Hosts: ${numUniqueHosts}`);
      }
    );
  });
}

FS.access(`./local.js`, FS.R_OK, err => {
  const defaultConfig = require(`./defaultConfig`);
  let setOfHosts = new Set(),
      localConfig = {},
      config;

  if (!err) {
    localConfig = require(`./local`);
  }

  config = Object.assign({}, defaultConfig, localConfig);
  getHosts(config, setOfHosts);
});
