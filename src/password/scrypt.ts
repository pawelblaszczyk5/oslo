import { scrypt } from "node:crypto";
import { alphabet, generateRandomString } from "../random/index.js";
import { encodeHex } from "../encoding/index.js";

import type { PasswordHashingAlgorithm } from "./index.js";

export interface ScryptConfig {
	N?: number;
	r?: number;
	p?: number;
	dkLen?: number;
}

export class Scrypt implements PasswordHashingAlgorithm {
	constructor(config: ScryptConfig = {}) {
		this.config = config;
	}

	private config: ScryptConfig;

	public async hash(password: string): Promise<string> {
		const salt = generateRandomString(16, alphabet("a-z", "A-Z", "0-9"));
		const key = await this.rawHash(password, salt);
		return `${salt}:${key}`;
	}

	public async verify(hash: string, password: string): Promise<boolean> {
		const [salt, key] = hash.split(":");
		const targetKey = await this.rawHash(password, salt!);
		return constantTimeEqual(targetKey, key!);
	}

	private async rawHash(password: string, salt: string): Promise<string> {
		const dkLen = this.config.dkLen ?? 64;
		return await new Promise<string>((resolve, reject) => {
			scrypt(
				password.normalize("NFKC"),
				salt!,
				dkLen,
				{
					N: this.config.N ?? 16384,
					p: this.config.p ?? 1,
					r: this.config.r ?? 16
				},
				(err, buff) => {
					if (err) return reject(err);
					return resolve(encodeHex(buff));
				}
			);
		});
	}
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}
	const aUint8Array = new TextEncoder().encode(a);
	const bUint8Array = new TextEncoder().encode(b);

	let c = 0;
	for (let i = 0; i < a.length; i++) {
		c |= aUint8Array[i]! ^ bUint8Array[i]!; // ^: XOR operator
	}
	return c === 0;
}
