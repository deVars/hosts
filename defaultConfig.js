module.exports = {
  DOMAIN_SOURCE_PATH: `./source-domain.list`,
  HOST_SOURCE_PATH: `./source-host.list`,
  SOURCE_LINE_ENDING: `\n`,
  LOCAL_LIST_PATH: `./local.list`,
  LOCAL_LIST_LINE_ENDING: `\n`,
  LINE_ENDINGS: [`\r\n`, `\r`, `\n`],
  HOST_ENTRY_PATTERN: /^(?:\d{1,3}\.){3}\d{1,3}[\s\t]+([0-9A-Za-z_.-]+)\b/,
  DOMAIN_ENTRY_PATTERN: /^([0-9A-Za-z_.-]+)\b/,
  REDIRECT_TO_IP: `0.0.0.0`,
  OUTPUT_DIRECTORY: `./dist`,
  OUTPUT_HOSTS_FILENAME: `hosts.txt`,
  OUTPUT_GRAVITY_FILENAME: `gravity.list`,
  OUTPUT_LINE_ENDING: `\n`,
};