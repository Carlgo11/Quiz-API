import { createJWT } from './tokens';
import bcrypt from 'bcryptjs';

export const adHeaders = {
	'Access-Control-Allow-Origin': ORIGINS,
	'Access-Control-Allow-Methods': 'PUT,POST,OPTIONS',
	'Access-Control-Max-Age': '7200',
	'Access-Control-Allow-Headers': 'Authorization',
	'Content-Type': 'application/json;charset=UTF-8',
	'Cache-Control': 'private'
};

// POST request
export async function verifyAdmin(request) {
	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(null, { status: 502, headers: adHeaders });
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
		return new Response(JSON.stringify({ error: 'Expected \'Authorization\' header with Basic Authentication credentials' }), {
			status: 401, headers: adHeaders
		});
	}

	const admin = await userDB.get(`admin:${user}`, { type: 'json' });
	if (bcrypt.compareSync(password, admin['password'])) {
		return new Response(JSON.stringify({ token: (await createJWT(user, admin['secret'])).token }), {
			status: 200, headers: adHeaders
		});
	} else {
		return new Response(JSON.stringify({ error: 'Incorrect login credentials' }), {
			status: 401, headers: adHeaders
		});
	}
}

// PUT request
export async function addAdmin(request) {
	// Verify JSON data
	if (request.headers.get('Accept') !== 'application/json') return new Response(null, {
		status: 406, headers: adHeaders
	});

	// Init user DB
	let userDB;
	try {
		userDB = USERS;
	} catch (e) {
		return new Response(null, { status: 502, headers: adHeaders });
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
		return new Response(JSON.stringify({ error: 'Expected \'Authorization\' header with Basic Authentication credentials' }), {
			status: 401, headers: adHeaders
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
