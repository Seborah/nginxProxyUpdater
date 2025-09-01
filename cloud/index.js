const crypto = require("crypto")
const { exec } = require("child_process")
const fs = require("fs")
const express = require("express")
const { hashAlgorithm, nginxProperties, keyFile } = require("./config.json")
const app = express()
const port = 8080
try {
	var publicKey = fs.readFileSync(keyFile, "utf8")
} catch (error) {
	console.error("Error loading key file:", error)
	process.exit(1)
}
//TODO pull out the signature and timestamp verification

async function validateSignature(timestamp, signature) {
	try {
		var date = new Date()
		date.setTime(parseInt(timestamp))
		if (Math.abs(date - new Date()) > 10000) {
			return false
		}
		const verifier = crypto.createVerify(hashAlgorithm)
		verifier.update(timestamp)
		// console.log("here")
		const isVerified = verifier.verify(publicKey, signature, "base64url")
		console.log(isVerified)
		if (!isVerified) {
			return false
		}
		console.log("Request is valid")
	} catch (error) {
		return false
	}
	return true
}

app.post("/updatenginx", (req, res) => {
	if (!req.query.timestamp || !req.query.signature) {
		res.status(400).send("Missing parameters")
		return
	}
	try {
		parseInt(req.query.timestamp)
	} catch (e) {
		res.status(400).send("Invalid")
		return
	}
	var signature = req.query.signature
	var timestamp = req.query.timestamp
	if (!validateSignature(timestamp, signature)) {
		res.status(400).send("Invalid request")
	}
	//TODO write the nginx config file
	var newString = req.body
	fs.writeFileSync(nginxProperties, newString)
	exec(
		"nginx -s reload",
		{
			timeout: 10000, // 10 seconds timeout
			shell: "/bin/bash", // Use bash shell to execute command
		},
		(error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`)

				res.sendStatus(500)
				return
			}
			console.log(`stdout: ${stdout}`)
			console.log(`stderr: ${stderr}`)
			res.sendStatus(200)
		}
	)
})
app.get("/getnginx", (req, res) => {
	if (!req.query.timestamp || !req.query.signature) {
		res.status(400).send("Missing parameters")
		return
	}
	try {
		parseInt(req.query.timestamp)
	} catch (e) {
		res.status(400).send("Invalid")
		return
	}
	var signature = req.query.signature
	var timestamp = req.query.timestamp
	if (!validateSignature(timestamp, signature)) {
		res.status(400).send("Invalid request")
	}

	try {
		var hash = crypto.createHash(hashAlgorithm).update(fs.readFileSync(nginxProperties)).digest("hex")
		res.json({ hash })
	} catch (error) {
		console.error("Error calculating hash:", error)
		res.status(500).send("Internal Server Error")
	}
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
