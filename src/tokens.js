import jwt from '@tsndr/cloudflare-worker-jwt';

/**
 * Validate a JWT against stored DB data
 * @param token JWT Token
 * @param userDB User Database
 * @param expected_type Expected User type / JWT Target Audience (optional)
 * @returns {Promise<string|false>} Returns username if found, otherwise false
 */
export async function validateJWT(token, userDB, expected_type = null) {
	const { sub: user, aud } = jwt.decode(token).payload;

	// Fetch user only from expected user type if type is set
	const types = expected_type ? [expected_type] : ['user', 'admin'];
	for (const type of types) {
		try {
			const { secret } = await userDB.get(`${type}:${user}`, { type: 'json' });
			if (await jwt.verify(token, secret))
				// Return false on unexpected user type (aud)
				return (expected_type === null || expected_type === aud) ? user : false;
		} catch (error) {
			// console.debug(error)
		}
	}

	return false;
}

/**
 * Create a new JWT
 * @param user Username
 * @param type "admin"|"user"
 * @param sec Secret to use. Leave empty to generate
 * @returns {Promise<{secret: string, token: string}>} Returns object containing JWT secret and token
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
