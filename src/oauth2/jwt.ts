import { decodeBase64, encodeBase64Url } from "../encoding/index.js";

const encoder = new TextEncoder();

export async function createES256SignedJWT(
	protectedHeader: {
		alg: "ES256";
		kid?: string;
	},
	payload: Record<any, any>,
	privateKey: string
): Promise<string> {
	const cryptoKey = await crypto.subtle.importKey(
		"pkcs8",
		decodeBase64(privateKey),
		{
			name: "ECDSA",
			namedCurve: "P-256"
		},
		true,
		["sign"]
	);
	const base64UrlHeader = encodeBase64Url(
		encoder.encode(JSON.stringify(protectedHeader))
	);
	const base64UrlPayload = encodeBase64Url(
		encoder.encode(JSON.stringify(payload))
	);
	const signatureBody = [base64UrlHeader, base64UrlPayload].join(".");
	const signatureBuffer = await crypto.subtle.sign(
		{
			name: "ECDSA",
			hash: "SHA-256"
		},
		cryptoKey,
		encoder.encode(signatureBody)
	);
	const signature = encodeBase64Url(signatureBuffer);
	const jwt = [signatureBody, signature].join(".");
	return jwt;
}
