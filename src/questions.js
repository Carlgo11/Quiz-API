import { validateJWT } from './tokens';

export const qHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'GET,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Authorization',
	'Accept': 'application/json',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};

async function getAvailableQuestions(questionDB) {
	try {
		let questions = {};
		for (const k of (await questionDB.list({ prefix: 'question:', type: 'json' })).keys) {
			const question = await questionDB.get(k.name, { type: 'json' });
			questions[(k.name).replace('question:', '')] = question.options;
		}
		return questions;
	} catch (error) {
		console.log(error);
	}
	return {};
}

// GET request
export async function questionsGet(request) {
	// Verify expected res Content-Type eql JSON
	if (request.headers.get('Accept') !== 'application/json')
		return new Response(null, { status: 406, headers: qHeaders });

	// Init question and user DB
	let questionDB
	let userDB
	try {
		questionDB = QUESTIONS;
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: qHeaders });
	}

	// Fetch username from JWT
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(null, { status: 401, headers: qHeaders });

	return new Response(JSON.stringify(await getAvailableQuestions(questionDB)), { headers: qHeaders });
}
