var fs = require("fs")
const crypto = require("crypto")

// A sample string to sign
const dataToSign = "Hello, this is a test string to be signed."

function generateKeys() {
	// IMPORTANT: Replace this with your actual private key.
	// For this example, we'll generate a key pair.
	const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: "spki",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
		},
	})

	fs.writeFileSync("../keys/private_key.pem", privateKey)
	fs.writeFileSync("../keys/public_key.pem", publicKey)
	return { privateKey, publicKey }
}

function loadKeys() {
	// Load the private key from a file
	const privateKey = fs.readFileSync("../keys/private_key.pem", "utf8")
	// Load the public key from a file
	const publicKey = fs.readFileSync("../keys/public_key.pem", "utf8")

	return { privateKey, publicKey }
}
generateKeys()

process.exit(0)
var { privateKey, publicKey } = loadKeys()

// Generate the keys if they don't exist
// Signing the data using the private key

// 1. Create a Sign object with the desired algorithm
const signer = crypto.createSign("RSA-SHA512")

// 2. Update the signer with the data
signer.update(dataToSign)

// 3. Generate the signature using the private key
const signature = signer.sign(privateKey, "base64url")

console.log("Original Data:", dataToSign)
console.log("Generated Signature:", signature)

// 4. Verification (Optional but recommended)
// To verify the signature, you need the public key
const verifier = crypto.createVerify("RSA-SHA512")
verifier.update(dataToSign)
const isVerified = verifier.verify(publicKey, signature, "base64url")

console.log("Signature Verified:", isVerified) // Should log 'true'
