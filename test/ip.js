var axios = require("axios")

async function getIP() {
	var req = await axios.get("https://api.ipify.org?format=json")
	console.log(req.data.ip)
}

getIP()
