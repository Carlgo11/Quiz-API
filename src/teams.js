import { createJWT } from './tokens';

export const tHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'PUT,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Content-Type',
	'Accept': 'application/json',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};

// PUT request
export async function teamsPut(request) {
	// Verify JSON data
	if (request.headers.get('Content-Type') !== 'application/json')
		return new Response(null, { status: 415, headers: tHeaders });

	// Fetch username from req body
	const { user } = await request.json();

	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(null, { status: 502, headers: tHeaders });
	}

	// Verify USER element set
	if (user === null) return new Response(JSON.stringify({ error: 'No user specified' }), {
		status: 422,
		headers: tHeaders
	});

	// Verify username isn't taken
	if (await userDB.get(`user:${user}`)) return new Response(JSON.stringify({ error: 'User already exists' }), {
		status: 409, headers: tHeaders
	});

	const { secret, token } = await createJWT(user);

	try {
		await userDB.put(`user:${user}`, JSON.stringify({ secret: secret, answers: {} }), { expirationTtl: 2 * 60 * 60 });
		return new Response(JSON.stringify({ token: token }), { status: 201, headers: tHeaders });
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500, headers: tHeaders });
	}
}
