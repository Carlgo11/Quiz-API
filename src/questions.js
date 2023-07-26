import { validateJWT } from './tokens';
import { verifyAdmin } from './admin';

export const qHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Content-Type,Authorization',
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
	if (request.headers.get('Accept') !== 'application/json') return new Response(null, {
		status: 406, headers: qHeaders
	});

	// Init question and user DB
	let questionDB;
	let userDB;
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

// PUT request
export async function questionsPut(request) {
	// Verify JSON data
	if (request.headers.get('Content-Type') !== 'application/json') return new Response(null, {
		status: 415, headers: qHeaders
	});

	if (request.headers.get('Accept') !== 'application/json') return new Response(null, {
		status: 406, headers: qHeaders
	});
	// Init question and user DB
	let questionDB;
	let userDB;
	try {
		questionDB = QUESTIONS;
		userDB = USERS;

	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: qHeaders });
	}

	// Auth user
	const is_admin = await verifyAdmin(request);
	if (is_admin.status !== 200) return is_admin;

	const body = await request.json();

	for (const question in body) {
		// Verify that question key is int
		if (!(/^\d+$/.test(question))) return new Response(JSON.stringify({ error: 'Question key must be numerical' }, {
			status: 422, headers: qHeaders
		}));

		// Verify that options & correct keys are included in question data
		const included = ['options', 'correct'].every(key => body[question].includes(key));
		if (!included) return new Response(JSON.stringify({ error: 'Keys \'options\' and \'correct\' must be present' }), {
			status: 422, headers: qHeaders
		});

		// Upload question data
		try {
			await questionDB.put(`question:${question}`, JSON.stringify(body[question]));
		} catch (error) {
			console.error(error);
			return new Response(JSON.stringify({ error: `Error uploading question ${question}.` }), {
				status: 500, headers: qHeaders
			});
		}
	}
	return new Response(null, { headers: qHeaders });
}
