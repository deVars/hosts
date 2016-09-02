'use strict';

const HTTP = require(`http`),
      CONSTANTS = require(`./constants`),
      HOSTS = require(`./hosts`),
      UTILS = require(`./utils`);

let setOfHosts = new Set(),
    hostsRequested = HOSTS.length,
    hostsDone = 0;

function processHostEntries(entries) {
  entries.forEach(entry => {
    let matches = CONSTANTS.ENTRY_PATTERN.exec(entry),
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
  const FS = require(`fs`),
        PATH = require(`path`),
        TEMPLATE = require(`./template`),
        OUTPUT_DIRECTORY = PATH.join(`./`, CONSTANTS.OUTPUT_DIRECTORY),
        OUTPUT_PATH = PATH.join(OUTPUT_DIRECTORY, CONSTANTS.OUTPUT_FILENAME);

  let dateToday = new Date(),
      finalData = Array.from(setOfHosts)
                    .map(entry => `${CONSTANTS.REDIRECT_TO_IP} ${entry}`),
      numUniqueHosts = finalData.length,
      finalDataString = finalData.join(CONSTANTS.OUTPUT_LINE_ENDING),
      dateString = `${UTILS.pad(dateToday.getUTCDate(), 2)}` +
                   `${UTILS.pad(dateToday.getUTCMonth() + 1, 2)}` +
                   `${dateToday.getUTCFullYear()}`;

  if (FS.exists(OUTPUT_DIRECTORY)) {
    FS.mkdirSync(OUTPUT_DIRECTORY);
  };

  FS.writeFile(OUTPUT_PATH,
    TEMPLATE.get(dateString, finalDataString, numUniqueHosts),
    () => {
    console.log(`I am done. Number of Hosts: ${numUniqueHosts}`);
    }
  );
}

HOSTS.forEach(host => {
  HTTP.get(UTILS.splitUrl(host), res => {
    let payload = [],
        lineEnding = undefined;

    res.on(`data`, chunk => {
      lineEnding = lineEnding ||
        CONSTANTS.LINE_ENDINGS.find(ending => chunk.lastIndexOf(ending) !== -1);
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