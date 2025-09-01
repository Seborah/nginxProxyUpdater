const crypto = require("crypto")
const fs = require("fs")
const express = require("express")
const app = express()
const port = 8080
function loadKeys() {
	// Load the private key from a file
	const privateKey = fs.readFileSync("../keys/private_key.pem", "utf8")
	// Load the public key from a file
	const publicKey = fs.readFileSync("../keys/public_key.pem", "utf8")

	return { privateKey, publicKey }
}
var { publicKey } = loadKeys()

//TODO pull out the signature and timestamp verification

app.post("/updatenginx", (req, res) => {
	try {
		console.log(req.query)
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
		var date = new Date()
		date.setTime(parseInt(req.query.timestamp))
		if (Math.abs(date - new Date()) > 10000) {
			res.status(400).send("Invalid")
			return
		}
		var signature = req.query.signature
		const verifier = crypto.createVerify("RSA-SHA512")
		verifier.update(req.query.timestamp)
		// console.log("here")
		const isVerified = verifier.verify(publicKey, signature, "base64url")
		console.log(isVerified)
		if (!isVerified) {
			res.status(400).send("Invalid")
			return
		}
		console.log("Request is valid")

		//TODO write the nginx config file
		res.json({ hash: "teehee" })
	} catch (error) {
		res.status(400).send("Invalid request")
		return
	}
})
app.get("/getnginx", (req, res) => {
	try {
		console.log(req.query)
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
		var date = new Date()
		date.setTime(parseInt(req.query.timestamp))
		if (Math.abs(date - new Date()) > 10000) {
			res.status(400).send("Invalid")
			return
		}
		var signature = req.query.signature
		const verifier = crypto.createVerify("RSA-SHA512")
		verifier.update(req.query.timestamp)
		// console.log("here")
		const isVerified = verifier.verify(publicKey, signature, "base64url")
		console.log(isVerified)
		if (!isVerified) {
			res.status(400).send("Invalid")
			return
		}
		console.log("Request is valid")

		//TODO read the nginx config file
		res.json({ hash: "1234" })
	} catch (error) {
		res.status(400).send("Invalid request")
		return
	}
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
