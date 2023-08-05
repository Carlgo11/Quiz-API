import { validateJWT } from './tokens';
import { validateAccept } from './router';

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
		console.error(error);
		return false;
	}
}

// GET request
export async function answersGet(request) {
	// Verify expected res Content-Type eql JSON
	if (validateAccept(request.headers.get('Accept')))
		return new Response(null, { status: 406, headers: aHeaders });

	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: aHeaders });
	}
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(JSON.stringify({ error: 'Incorrect or missing access token' }), {
		status: 401, headers: { ...aHeaders, ['WWW-Authenticate']: 'Bearer realm="Authentication Required"' }
	});
	const answers = (await userDB.get(`user:${user}`, { type: 'json' })).answers;
	return new Response(JSON.stringify(answers), { headers: aHeaders });
}

// POST request
export async function answersPost(request) {
	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: aHeaders });
	}

	// Verify Content-Type
	if (request.headers.get('Content-Type') !== 'application/json') return new Response(null, {
		status: 415,
		headers: { accept: 'application/json' }
	});

	// Fetch username from JWT
	const user = await validateJWT(request, userDB);

	if (!user) {
		const headers = {
			...aHeaders, ['WWW-Authenticate']: 'Bearer realm="Authentication Required"'
		};
		return new Response(JSON.stringify({ error: 'Incorrect or missing access token' }), {
			status: 401, headers: headers
		});
	}

	// Fetch answers from req body
	const { answers } = await request.json();
	if (!answers) return new Response(JSON.stringify({ error: 'Payload Missing' }), {
		status: 422, headers: aHeaders
	});

	// Store answers in DB
	if (await storeUserAnswers({ user, answers }, userDB)) return new Response(null, { status: 204, headers: aHeaders });

	// Catch-all 500 response
	return new Response(null, { status: 500 });
}
