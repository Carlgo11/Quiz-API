import jwt from '@tsndr/cloudflare-worker-jwt';

export async function validateJWT(request, userDB, expected_type = null) {
	try {
		const token = request.headers.get('Authorization').split('Bearer ')[1];
		const { sub: user, type } = jwt.decode(token).payload;
		const { secret } = await userDB.get(`user:${user}`, { type: 'json' }) || await userDB.get(`admin:${user}`, { type: 'json' });
		if(expected_type !== null && expected_type !== type) return false;
		if (await jwt.verify(token, secret)) return user;
	} catch (error) {
		console.error(error);
	}
	return false;
}

/**
 *
 * @param user Username
 * @param type "admin"|"user"
 * @param sec Secret to use. Leave empty to generate
 * @returns {Promise<{secret: string, token: string}>}
 */
export async function createJWT(user, type = 'user', sec = null) {
	const secret = sec || crypto.randomUUID();
	const token = await jwt.sign({
		sub: user, // Set subject to username
		nbf: Math.floor(Date.now() / 1000), // Not before: now
		aud: type, // Specify account type
		exp: Math.floor(Date.now() / 1000) + (2 * (60 * 60)) // Expires: 2h
	}, secret);
	return { secret, token };
}
