import { createJWT } from './tokens';
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'HEAD,PUT,OPTIONS',
	'Access-Control-Max-Age': '86400',
	'Access-Control-Allow-Headers': 'Accept,Content-Type'
};

// PUT request
export async function teamsPut(request) {
	const { user } = await request.json();
	const userDB = USERS;
	if (user === null) return new Response(JSON.stringify({ error: 'No user specified' }), {
		status: 400, headers: corsHeaders
	});
	if (await userDB.get(`user:${user}`)) return new Response(JSON.stringify({ error: 'User already exists' }), {
		status: 409, headers: corsHeaders
	});
	const { secret, token } = await createJWT(user);
	try {
		await userDB.put(`user:${user}`, JSON.stringify({ secret: secret, answers: {} }), { expirationTtl: 2 * 60 * 60 });
		return new Response(JSON.stringify({ token: token }), { status: 201, headers: corsHeaders });
	} catch (error) {
		console.log(error);
		return new Response(null, { status: 500, headers: corsHeaders });
	}
}

// OPTIONS request
export function teamsOptions() {
	return new Response(null, { status: 204, headers: corsHeaders });
}
