import jwt from "@tsndr/cloudflare-worker-jwt";

export async function validateJWT(request, userDB) {
	try {
		const token = request.headers.get('Authorization').split('Bearer ')[1]
		const {user} = jwt.decode(token)
		const {secret} = await userDB.get(`user:${user}`, {type: 'json'})
		if (await jwt.verify(token, secret)) return user
	} catch (error) {
		console.log(error)
	}
	return false;
}

export async function createJWT(user) {
	const secret = crypto.randomUUID();
	const token = await jwt.sign({
		user: user, nbf: Math.floor(Date.now() / 1000), // Not before: now
		exp: Math.floor(Date.now() / 1000) + (2 * (60 * 60)) // Expires: 2h
	}, secret);
	return { secret, token };
}