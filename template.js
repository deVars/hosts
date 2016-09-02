module.exports = {
  get: (dateString, finalDataString, numUniqueHosts) => {
    return `# ========================================================
# Hosts File v${dateString}
# ${numUniqueHosts} unique hosts
# by Roseller Velicaria, Jr <github.com/deVars>
# This file is a combined hosts file from respected sources
# ========================================================
127.0.0.1          localhost
127.0.0.1          localhost.localdomain
127.0.0.1          local
255.255.255.255    broadcasthost
::1                localhost
fe80::1%lo0        localhost

# ========================================================
${finalDataString}
`;
}
}