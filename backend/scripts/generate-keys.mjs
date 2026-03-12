/**
 * Generates an RS256 (RSA 2048-bit) key pair and outputs the values
 * formatted and ready to paste into your .env file.
 *
 * Run with:
 *   node scripts/generate-keys.mjs
 */

import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

// Convert multi-line PEM to single-line with escaped \n for .env
const toEnvLine = (pem) => pem.replace(/\n/g, "\\n");

console.log("\n✅ Keys generated successfully!\n");
console.log("──────────────────────────────────────────────────────────────");
console.log("Copy the values below into your .env file:\n");

console.log(`JWT_PRIVATE_KEY="${toEnvLine(privateKey)}"`);
console.log();
console.log(`JWT_PUBLIC_KEY="${toEnvLine(publicKey)}"`);
console.log("\n──────────────────────────────────────────────────────────────");
console.log("⚠️  Keep private.pem secret. Do not commit it to git.\n");
