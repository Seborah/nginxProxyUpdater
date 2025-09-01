var server = "http://localhost:8080"
var fs = require("fs")
const crypto = require("crypto")
var axios = require("axios")
function loadKeys() {
	// Load the private key from a file
	const privateKey = fs.readFileSync("../keys/private_key.pem", "utf8")
	// Load the public key from a file
	const publicKey = fs.readFileSync("../keys/public_key.pem", "utf8")

	return { privateKey, publicKey }
}

var { privateKey } = loadKeys()
const signer = crypto.createSign("RSA-SHA512")
const nowTime = Date.now()
signer.update(nowTime.toString())
const signature = signer.sign(privateKey, "base64url")
console.log("Generated signature: " + signature.length)
async function getIP() {
	var req = await axios.get("https://api.ipify.org?format=json")
	console.log(req.data.ip)
}
async function generateNginxConfig() {
	try {
		var myIP = await getIP()
	} catch (error) {
		console.error("Error getting IP: ", error)
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

var newConfig = ""
async function getNginxConfig() {
	//TODO generate the hash for the current nginx config
	newConfig = await generateNginxConfig()
	var localHash = crypto.createHash("sha512").update(newConfig).digest("hex")
	try {
		var serverHash = await axios.get(server + "/getnginx?timestamp=" + nowTime + "&signature=" + signature)
	} catch (error) {
		console.error("Error getting server config hash")
		process.exit(1)
	}
	console.log("Local hash: " + localHash)
	console.log("Server hash: ")
	console.log(serverHash.data.hash)

	//TODO if it differs send a request to the server to update the config

	//TODO else do nothing
	return "nginx config"
}
getNginxConfig()
