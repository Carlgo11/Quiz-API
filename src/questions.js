import { validateJWT } from './tokens';
import { validateAccept } from './global';
import { tHeaders } from './teams';

export const qHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS,DELETE',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Content-Type,Authorization',
	'Accept': 'application/json',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};
export const dHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Authorization',
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
	if (validateAccept(request.headers.get('Accept'))) return new Response(null, {
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
	const user = await validateJWT(request.headers.get('Authorization').split('Bearer ')[1], userDB);
	const headers = {
		...qHeaders,
		['WWW-Authenticate']: 'Bearer realm="Authentication Required"'
	};
	if (!user) return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
		status: 401,
		headers: headers
	});

	return new Response(JSON.stringify(await getAvailableQuestions(questionDB)), { headers: qHeaders });
}

// PUT request
export async function questionsPut(request) {
	// Verify JSON data
	if (request.headers.get('Content-Type') !== 'application/json') return new Response(null, {
		status: 415, headers: qHeaders
	});
	if (validateAccept(request.headers.get('Accept'))) return new Response(null, {
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

	// Validate user access
	if (!(await validateJWT(request.headers.get('Authorization').split('Bearer ')[1], userDB, 'admin'))) return new Response(JSON.stringify({ error: 'Incorrect, missing or insufficient login credentials' }), {
		status: 401, headers: {
			...tHeaders, ['WWW-Authenticate']: 'Bearer realm="Admin Credentials Required"'
		}
	});

	const body = await request.json();

	for (const question in body) {
		// Verify that question key is int
		if (!(/^\d+$/.test(question))) return new Response(JSON.stringify({ error: 'Question key must be numerical' }, {
			status: 422, headers: qHeaders
		}));

		// Verify that options & correct keys are included in question data
		const included = ['options', 'correct'].every(key => body[question].hasOwnProperty(key));
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
	return new Response(null, { status: 201, headers: qHeaders });
}

export async function questionDel(request) {
	const question = request.params.question;
	if (!question) return new Response(JSON.stringify({ error: 'No Question key set' }), {
		status: 400,
		headers: dHeaders
	});

// Init question and user DB
	let questionDB;
	let userDB;
	try {
		questionDB = QUESTIONS;
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: dHeaders });
	}

	// Validate user access
	if (!(await validateJWT(request.headers.get('Authorization').split('Bearer ')[1], userDB, 'admin'))) return new Response(JSON.stringify({ error: 'Incorrect, missing or insufficient login credentials' }), {
		status: 401, headers: {
			...tHeaders, ['WWW-Authenticate']: 'Bearer realm="Admin Credentials Required"'
		}
	});

	try {
		if (await questionDB.get(`question:${question}`) === null)
			return new Response(JSON.stringify({ error: `Question ${question} not found` }), {
				status: 404,
				headers: dHeaders
			});
		await questionDB.delete(`question:${question}`);
		return new Response(null, { status: 204, headers: dHeaders });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: `Error deleting question ${question}` }), {
			status: 500,
			headers: dHeaders
		});
	}
}
