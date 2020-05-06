module.exports = {
  get: (dateString, finalDataString, numUniqueHosts) => (
`# ========================================================
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
::1                ip6-localhost ip6-loopback
fe00::0            ip6-localnet
ff00::0            ip6-mcastprefix
ff02::1            ip6-allnodes
ff02::2            ip6-allrouters
ff02::3            ip6-allhosts
#fe80::1%lo0       localhost

# ========================================================
${finalDataString}
`)
};