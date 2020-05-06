'use strict';

const fs = require(`fs`),
      http = require(`http`),
      https = require(`https`),
      { Writable } = require(`stream`),
      utils = require(`./utils`);

class DomainSetWriter extends Writable {
  constructor(options) {
    super(options);
    this.domainSet = new Set();
    this.chunkTrimmings = '';
  }
  _write(chunk, encoding, callback) {
    const chunkStr = chunk.toString('utf8'),
          possibleLineEndings = ['\r\n', '\r', '\n'],
          lineEnding = possibleLineEndings.find(ending =>
            chunkStr.lastIndexOf(ending) !== -1);
    if (!lineEnding) {
      callback();
      return;
    }

    const [firstLine, ...otherLines] = chunkStr.split(lineEnding)
      .filter(line => !line.startsWith('#'));
    const lastLine = otherLines.pop();
    const cleanedChunkStr = [this.chunkTrimmings + firstLine, ...otherLines]
      .join('\n');

    const domainPattern = /((?:[a-z0-9_-]+\.)+[a-z]{2,})\b.*?\n/g;

    let match;
    while ((match = domainPattern.exec(cleanedChunkStr)) !== null) {
      if (!!match[1]) {
        this.domainSet.add(match[1]);
      }
    }
    // node 12
    // const matches = [...matchChunk.matchAll(domainPattern)]
    //   .map(([fullMatch, capture]) => capture)
    //   .filter(capture => capture);

    this.chunkTrimmings = lastLine;
    callback();
  }
}

async function getListFromFile(path, separator) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.split(separator).filter(line => line));
    });
  });
}

async function getDomains(config, sourceURLs) {
  return new Promise(async (resolve, reject) => {
    const domainSetPromises = sourceURLs.map(url =>
      new Promise((resolve, reject) => {
        console.log(`processing ${url}. . .`);

        const isHttpsProtocolPattern = /^https/,
              httpOrhttps = url.match(isHttpsProtocolPattern) ? https : http,
              domainSetWriter = new DomainSetWriter(),
              pipeToDomainWriter = (res) =>
                res.pipe(domainSetWriter)
                  .on(`finish`, () => {
                    resolve(domainSetWriter.domainSet);
                    domainSetWriter.destroy();
                  });

        httpOrhttps.get(url, pipeToDomainWriter)
          .on(`error`, e => {
            domainSetWriter.destroy();
            reject(e.message);
          });
      })
    );

    const localListPromise = getListFromFile(config.LOCAL_LIST_PATH, config.LOCAL_LIST_LINE_ENDING)
      .then(list => new Set([...list]));
    try {
      const domainSets = await Promise.all([...domainSetPromises, localListPromise]);
      resolve(domainSets.reduce((aggDomainSet, domainSet) =>
        new Set([...aggDomainSet, ...domainSet]), new Set()));
    } catch (rejectReason) {
      reject(rejectReason);
    }
  });
}

function writeAsHostsFile(config, hosts) {
  const path = require(`path`),
        template = require(`./template`),
        outDir = path.join(config.OUTPUT_DIRECTORY),
        outPath = path.join(outDir, config.OUTPUT_HOSTS_FILENAME);

  const dateToday = new Date(),
        finalData = Array.from(hosts)
                      .map(entry => `${config.REDIRECT_TO_IP} ${entry}`),
        numUniqueHosts = finalData.length,
        finalDataString = finalData.join(config.OUTPUT_LINE_ENDING),
        dateString = `${utils.pad(dateToday.getUTCDate(), 2)}` +
                      `${utils.pad(dateToday.getUTCMonth() + 1, 2)}` +
                      `${dateToday.getUTCFullYear()}`;

  fs.access(outDir, fs.F_OK | fs.R_OK | fs.W_OK, err => {
    if (err) {
      fs.mkdirSync(outDir);
    }
    fs.writeFile(outPath,
      template.get(dateString, finalDataString, numUniqueHosts),
      () => {
      console.log(`I am done. Number of Hosts: ${numUniqueHosts}`);
      }
    );
  });
}

function writeAsGravityListFile(config, domains) {
  const path = require(`path`),
        outDir = path.join(config.OUTPUT_DIRECTORY),
        outPath = path.join(outDir, config.OUTPUT_GRAVITY_FILENAME);

  const finalData = Array.from(domains),
        finalDataString = finalData.join(config.OUTPUT_LINE_ENDING);

  fs.access(outDir, fs.F_OK | fs.R_OK | fs.W_OK, err => {
    if (err) {
      fs.mkdirSync(outDir);
    }
    fs.writeFile(outPath, finalDataString, () => {
      console.log(`I am done writing the gravity file.`);
    });
  });
}

fs.access(`./local.js`, fs.R_OK, async err => {
  const defaultConfig = require(`./defaultConfig`);
  const localConfig = !!err ? {} : require(`./local`);
  const config = { ...defaultConfig, ...localConfig };
  const hostSources = await
    getListFromFile(config.HOST_SOURCE_PATH, config.SOURCE_LINE_ENDING);
  const domainSources = await
    getListFromFile(config.DOMAIN_SOURCE_PATH, config.SOURCE_LINE_ENDING);
  try {
    const domains = await getDomains(config, [...hostSources, ...domainSources]);
    writeAsHostsFile(config, domains);
    writeAsGravityListFile(config, domains);
  } catch(e) {
    console.error(e)
  }
});
