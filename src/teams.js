import { createJWT, validateJWT } from './tokens';
import { validateAccept } from './router';
import { qHeaders } from './questions';

export const tHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Authorization,Content-Type',
	'Accept': 'application/json',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};

async function compareAnswers(user, questions) {
	const answers = (await USERS.get(user, { type: 'json' })).answers;
	let result = {};
	let tally = 0;
	for (const [i, question] of Object.entries(questions)) {
		const name = i.replace('question:', '');
		const correct = JSON.parse(question).correct;
		let answer = {};
		answer = {
			answer: answers[name],
			correct: answers[name] === correct
		};
		if (answers[name] === correct) tally++;
		result[name] = answer;
	}
	result = { ...result, total: `${tally}/${Object.entries(questions).length}` };
	console.log(result)
	return result;
}

export async function teamsGet(request) {
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
	const requestee = await validateJWT(request, userDB);
	if (!requestee) return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
		status: 401, headers: {
			...adHeaders,
			['WWW-Authenticate']: 'Bearer realm="Admin Credentials Required"'
		}
	});
	// Authenticate that user is admin
	const admin = await userDB.get(`admin:${requestee}`, { type: 'json' });
	if (!admin) return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
		status: 403,
		headers: dHeaders
	});
	const users = await userDB.list({ prefix: 'user:' }, { type: 'json' });
	const question_keys = await questionDB.list({ prefix: 'question:' }, { type: 'json' });
	let teams = {};
	let questions = {};
	for (const { name: question } of question_keys.keys) {
		questions[question] = await questionDB.get(question);
	}
	for (const { name: user } of users.keys) {
		const username = user.replace('user:', '');
		teams[username] = await compareAnswers(user, questions);
	}
	return new Response(JSON.stringify(teams), { status: 200, headers: tHeaders });
}

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
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: tHeaders });
	}

	// Verify USER element set
	if (user === null) return new Response(JSON.stringify({ error: 'No username specified' }), {
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
