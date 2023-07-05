import { validateJWT } from './tokens';

const corsHeaders = {
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
	const questionDB = QUESTIONS;
	const userDB = USERS;
	const user = await validateJWT(request, userDB);
	if (!user) return new Response(null, { status: 401, headers: corsHeaders });
	return new Response(JSON.stringify(await getAvailableQuestions(questionDB)), { headers: corsHeaders });
}

// OPTIONS request
export function questionsOptions() {
	return new Response(null, { status: 204, headers: corsHeaders });
}
