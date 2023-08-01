import { createJWT } from './tokens';
import bcrypt from 'bcryptjs';
import { validateAccept } from './router';

export const adHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'PUT,POST,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Authorization',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};
const authHeaders = {
	...adHeaders, ['WWW-Authenticate']: 'Basic realm="Admin Credentials Required"'
};

// POST request
export async function verifyAdmin(request) {
	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: adHeaders });
	}

	let user, password;
	try {
		// Fetch username & password from body
		const authorization = atob(await request.headers.get('Authorization').split('Basic ')[1]).split(':');
		const { 0: _user, 1: _password } = authorization;
		user = _user;
		password = _password;
		// Verify payload is present
		if (user === null || password === null) throw new Error();
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
			status: 401, headers: authHeaders
		});
	}

	const admin = await userDB.get(`admin:${user}`, { type: 'json' });
	if (bcrypt.compareSync(password, admin['password'])) {
		return new Response(JSON.stringify({ token: (await createJWT(user, admin['secret'])).token }), {
			status: 200, headers: adHeaders
		});
	} else return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
		status: 401, headers: authHeaders
	});
}

// PUT request
export async function addAdmin(request) {
	// Verify JSON data
	if (validateAccept(request.headers.get('Accept'))) return new Response(null, {
		status: 406, headers: adHeaders
	});

	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: adHeaders });
	}

	// Fetch username & password from body
	let user, password;
	try {
		// Fetch username & password from body
		const authorization = atob(await request.headers.get('Authorization').split('Basic ')[1]).split(':');
		const { 0: _user, 1: _password } = authorization;
		user = _user;
		password = _password;
		// Verify payload is present
		if (user === null || password === null) throw new Error();
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Incorrect or missing login credentials' }), {
			status: 401, headers: authHeaders
		});
	}

	const pass_hash = bcrypt.hashSync(password, 10);

	// Verify that no other admins are present
	const allAdmins = await userDB.list({ prefix: 'admin:', type: 'json' });
	if (allAdmins.keys.length) return new Response(null, { status: 409, headers: adHeaders });

	const { secret, token } = await createJWT(user);
	try {
		userDB.put(`admin:${user}`, JSON.stringify({ secret: secret, password: pass_hash }));
		return new Response(JSON.stringify({ token: token }), { status: 201, headers: adHeaders });
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500, headers: adHeaders });
	}
}
