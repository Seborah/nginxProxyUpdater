var server = 'http://localhost:8080'
var fs = require('fs')
const crypto = require('crypto')
var axios = require('axios')
const { hashAlgorithm, domain, keyFile } = require('./conf.json')

var privateKey = fs.readFileSync(keyFile, 'utf8')

async function getIP() {
    var req = await axios.get('https://api.ipify.org?format=json')
    return req.data.ip
}
async function generateNginxConfig() {
    try {
        var myIP = await getIP()
    } catch (error) {
        console.error('Error getting IP: ', error)
        process.exit(1)
    }
    var config = `user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
events {
        worker_connections 768;
        # multi_accept on;
}

stream{
    server{
        listen 25565;
        proxy_pass ${myIP}:25565;
    }
    server{
        listen 25566;
        proxy_pass  ${myIP}:25566;
    }
    server{
        listen 25567;
        proxy_pass  ${myIP}:25567;
    }
    server{
        listen 25568;
        proxy_pass  ${myIP}:25568;
    }
    server{
        listen 25569;
        proxy_pass  ${myIP}:25569;
    }
}`
    return config
}

function generateParams() {
    const signer = crypto.createSign(hashAlgorithm)
    const nowTime = Date.now()
    signer.update(nowTime.toString())
    const signature = signer.sign(privateKey, 'base64url')
    return '?timestamp=' + nowTime + '&signature=' + signature
}
var newConfig = ''
async function getNginxConfig() {
    //TODO generate the hash for the current nginx config
    newConfig = await generateNginxConfig()
    var localHash = crypto.createHash('sha512').update(newConfig).digest('hex')
    try {
        var serverHash = await axios.get(
            domain + '/getnginx' + generateParams()
        )
    } catch (error) {
        console.error('Error getting server config hash')
        process.exit(1)
    }
    console.log('Local hash: ' + localHash)
    console.log('Server hash: ')
    console.log(serverHash.data.hash)
    console.log(newConfig)
    if (localHash !== serverHash.data.hash) {
        console.log(
            'Config has changed, sending update request to the server...'
        )
        try {
            var meow = await axios.post(
                domain + '/updatenginx' + generateParams(),
                newConfig,
                {
                    headers: { 'Content-Type': 'text/plain' },
                }
            )
            console.log(meow.data)
            console.log('Update request sent successfully')
        } catch (error) {
            console.error('Error sending update request to the server: ')
        }
    }
    return
}
getNginxConfig()
