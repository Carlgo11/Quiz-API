import { createJWT, validateJWT } from './tokens';
import { validateAccept } from './global';

export const tHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS,DELETE',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Accept,Authorization,Content-Type',
	'Accept': 'application/json',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};

// Compare a user's answers with the correct answers for a question
async function compareAnswers(user, questions) {
	const { answers } = await USERS.get(user, { type: 'json' });
	let tally = 0;

	const result = Object.keys(questions).reduce((ans, i) => {
		const name = i.replace('question:', '');
		const correct = JSON.parse(questions[i]).correct;
		const isCorrect = answers[name] === correct;

		ans[name] = { answer: answers[name], correct: isCorrect };
		tally += isCorrect ? 1 : 0;

		return ans;
	}, {});

	result.total = `${tally}/${Object.keys(questions).length}`;
	return result;
}

// GET request
export async function teamsGet(request) {
	// Verify expected res Content-Type eql JSON
	if (validateAccept(request.headers.get('Accept')))
		return new Response(null, { status: 406, headers: tHeaders });

	// Init question and user DB
	let questionDB;
	let userDB;
	try {
		questionDB = QUESTIONS;
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: tHeaders });
	}

	// Fetch username from JWT
	const requestee = await validateJWT(request, userDB);
	if (!requestee) return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
		status: 401, headers: {
			...tHeaders, ['WWW-Authenticate']: 'Bearer realm="Admin Credentials Required"'
		}
	});

	// Authenticate that user has admin rights
	if (!(await userDB.get(`admin:${requestee}`, { type: 'json' })))
		return new Response(JSON.stringify({ error: 'Admin privileges required' }), { status: 403, headers: tHeaders });

	// Fetch list of users and questions
	const questions = Object.fromEntries(await Promise.all((await questionDB.list({ prefix: 'question:' }, { type: 'json' })).keys.map(async ({ name }) => [name, await questionDB.get(name)])));
	const teams = Object.fromEntries(await Promise.all((await userDB.list({ prefix: 'user:' }, { type: 'json' })).keys.map(async ({ name }) => [name.replace('user:', ''), await compareAnswers(name, questions)])));

	// Convert the teams object to an array of [teamName, teamData] pairs
	const teams_array = Object.entries(teams);

	// Return empty object is no teams exist
	if (!teams_array.length) return new Response(JSON.stringify({}), { status: 200, headers: tHeaders });

	// Get Y (total questions) from the first team entry since it's the same for all teams
	const totalQuestions = teams_array[0][1].total.split('/')[1];

	// Sort the array based on the 'total' value in descending order
	teams_array.sort(([, aData], [, bData]) => {
		const aCorrect = aData.total.split('/')[0];
		const bCorrect = bData.total.split('/')[0];
		return (bCorrect / totalQuestions) - (aCorrect / totalQuestions);
	});

	return new Response(JSON.stringify(Object.fromEntries(teams_array)), { status: 200, headers: tHeaders });
}

// PUT request
export async function teamsPut(request) {
	// Verify JSON data
	if (request.headers.get('Content-Type') !== 'application/json') return new Response(null, {
		status: 415, headers: tHeaders
	});

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
		status: 422, headers: tHeaders
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

// DELETE request
export async function teamsDel(request) {
	// Verify JSON data
	if (request.headers.get('Content-Type') !== 'application/json') return new Response(null, {
		status: 415, headers: tHeaders
	});

	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: tHeaders });
	}

	// Fetch username from JWT
	const requestee = await validateJWT(request, userDB);
	if (!requestee) return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
		status: 401, headers: {
			...tHeaders,
			['WWW-Authenticate']: 'Bearer realm="Admin Credentials Required"'
		}
	});

	// Authenticate that user is admin
	const admin = await userDB.get(`admin:${requestee}`, { type: 'json' });
	if (!admin) return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
		status: 403,
		headers: tHeaders
	});

	// Fetch username from req body
	const { user } = await request.json();

	// Verify USER element set
	if (user === null) return new Response(JSON.stringify({ error: 'No username specified' }), {
		status: 422, headers: tHeaders
	});

	try {
		await userDB.delete(`user:${user}`);
		return new Response(null, { status: 200, headers: tHeaders });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: `Error deleting user ${user} from database.` }), {
			status: 500,
			headers: tHeaders
		});
	}
}
