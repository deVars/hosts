'use strict';

const FS = require(`fs`),
      HTTP = require(`http`),
      HOSTS = require(`./hosts`),
      UTILS = require(`./utils`),
      constants = require(`./constants`);

let config = undefined,
    localConfig = {},
    setOfHosts = new Set(),
    hostsRequested = HOSTS.length,
    hostsDone = 0;

function processHostEntries(entries) {
  entries.forEach(entry => {
    let matches = config.ENTRY_PATTERN.exec(entry),
        host = matches && matches[1] || undefined;
    if (host) {
      setOfHosts.add(host);
    }
  });
}

function prepareData() {
  const CUSTOM_ENTRIES = require(`./customEntries`);

  CUSTOM_ENTRIES.forEach(entry => {
    setOfHosts.add(entry);
  });
  setOfHosts.delete(`localhost`);
  writeData();
}

function writeData() {
  const PATH = require(`path`),
        TEMPLATE = require(`./template`),
        OUTPUT_DIRECTORY = PATH.join(`./`, config.OUTPUT_DIRECTORY),
        OUTPUT_PATH = PATH.join(OUTPUT_DIRECTORY, config.OUTPUT_FILENAME);

  let dateToday = new Date(),
      finalData = Array.from(setOfHosts)
                    .map(entry => `${config.REDIRECT_TO_IP} ${entry}`),
      numUniqueHosts = finalData.length,
      finalDataString = finalData.join(config.OUTPUT_LINE_ENDING),
      dateString = `${UTILS.pad(dateToday.getUTCDate(), 2)}` +
                   `${UTILS.pad(dateToday.getUTCMonth() + 1, 2)}` +
                   `${dateToday.getUTCFullYear()}`;

  try {
    FS.accessSync(OUTPUT_DIRECTORY, FS.F_OK);
  } catch (e) {
    FS.mkdirSync(OUTPUT_DIRECTORY);
  }

  FS.writeFile(OUTPUT_PATH,
    TEMPLATE.get(dateString, finalDataString, numUniqueHosts),
    () => {
    console.log(`I am done. Number of Hosts: ${numUniqueHosts}`);
    }
  );
}

try {
  FS.accessSync(`./local.js`, FS.R_OK);
  localConfig = require(`./local`);
} catch (e) {}

config = Object.assign({}, constants, localConfig);

HOSTS.forEach(host => {
  console.log(`processing ${host}. . .`);
  HTTP.get(UTILS.splitUrl(host), res => {
    let payload = [],
        lineEnding = undefined;

    res.on(`data`, chunk => {
      lineEnding = lineEnding ||
        config.LINE_ENDINGS.find(
          ending => chunk.toString().lastIndexOf(ending) !== -1
        );

      payload.push(chunk);
    });
    res.on(`end`, () => {
      let data = payload.join().split(lineEnding);

      processHostEntries(data);
      hostsDone++;
      if (hostsDone === hostsRequested) {
        prepareData();
      }
    })
  }).on(`error`, e => {
    console.log(`Got error: ${e.message}`);
  });
});