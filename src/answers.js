import { validateJWT } from './tokens';
import { qHeaders } from './questions';

export const aHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'HEAD,PUT,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Content-Type,Authorization',
	'Accept': 'application/json',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'no-cache'
};

async function storeUserAnswers({ user, answers }, userDB) {
	try {
		let userObject = await userDB.get(`user:${user}`, { type: 'json' }) || {};
		userObject['answers'] = { ...answers };
		await userDB.put(`user:${user}`, JSON.stringify(userObject));
		return true;
	} catch (error) {
		console.log(error);
	}
}

function getUserAnswers(user, userDB) {
	return userDB.get(`user:${user}`, { type: 'json' })
		.then(userObject => userObject.answers || null);
}

// GET request
// Get uploaded answers by the user (currently not used by UI)
export async function answerGet(request) {
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: qHeaders });
	}
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(null, { status: 401 });
	return new Response(JSON.stringify(getUserAnswers(user, userDB)), { headers: aHeaders });
}

// POST request
export async function answerPost(request) {
	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: qHeaders });
	}

	// Verify Content-Type
	if (request.headers.get('Content-Type') !== 'application/json')
		return new Response(null, { status: 415, headers: { accept: 'application/json' } });

	// Fetch username from JWT
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(null, { status: 401, headers: aHeaders });

	// Fetch answers from req body
	const { answers } = await request.json();
	if (!answers) return new Response(JSON.stringify({ error: 'Payload Missing' }), {
		status: 422,
		headers: { 'content-type': 'application/json' }
	});

	// Store answers in DB
	if (await storeUserAnswers({ user, answers }, userDB))
		return new Response(null, { status: 204, headers: aHeaders });

	// Catch-all 500 response
	return new Response(null, { status: 500 });
}
