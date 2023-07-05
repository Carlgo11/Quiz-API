import { validateJWT } from './tokens';

const corsHeaders = {
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
	const userDB = USERS;
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(null, { status: 401 });
	return new Response(JSON.stringify(getUserAnswers(user, userDB)), { headers: corsHeaders });
}

// POST request
export async function answerPost(request) {
	const userDB = USERS;
	if (request.headers.get('Content-Type') !== 'application/json')
		return new Response(null, { status: 406, headers: { accept: 'application/json' } });
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(null, { status: 401, headers: corsHeaders });
	const { answers } = await request.json();
	if (!answers) return new Response(JSON.stringify({ error: 'Payload Missing' }), {
		status: 422,
		headers: { 'content-type': 'application/json' }
	});
	if (await storeUserAnswers({ user, answers }, userDB))
		return new Response(null, { status: 204, headers: corsHeaders });
	return new Response(null, { status: 500 });
}

// OPTIONS request
export function answerOptions() {
	return new Response(null, { status: 204, headers: corsHeaders });
}
