import jwt from '@tsndr/cloudflare-worker-jwt';

export async function validateJWT(request, userDB) {
	try {
		const token = request.headers.get('Authorization').split('Bearer ')[1];
		const { sub: user } = jwt.decode(token).payload;
		const { secret } = await userDB.get(`user:${user}`, { type: 'json' }) || await userDB.get(`admin:${user}`, { type: 'json' });
		if (await jwt.verify(token, secret)) return user
	} catch (error) {
		console.error(error);
	}
	return false;
}

export async function createJWT(user, sec = null) {
	const secret = sec || crypto.randomUUID();
	const token = await jwt.sign({
		sub: user, nbf: Math.floor(Date.now() / 1000), // Not before: now
		exp: Math.floor(Date.now() / 1000) + (2 * (60 * 60)) // Expires: 2h
	}, secret);
	return { secret, token };
}
