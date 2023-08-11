import { Router } from 'itty-router';
import { aHeaders, answersGet, answersPost } from './answers';
import { dHeaders, qHeaders, questionDel, questionsGet, questionsPut } from './questions';
import { teamsDel, teamsGet, teamsPut, tHeaders } from './teams';
import { addAdmin, adHeaders, verifyAdmin } from './admin';

const router = Router();

// Answers
router.get('/api/answers', async (request) => await answersGet(request));
router.post('/api/answers', (request) => answersPost(request));
router.options('/api/answers', () => new Response(null, { status: 204, headers: aHeaders }));
router.all('/api/answers', () => new Response(null, { status: 405, headers: aHeaders }));

// Questions
router.get('/api/questions', async (request) => await questionsGet(request));
router.put('/api/questions', async (request) => await questionsPut(request));
router.delete('/api/questions/:question', async (request) => await questionDel(request));
router.options('/api/questions', () => new Response(null, { status: 204, headers: qHeaders }));
router.options('/api/questions/*', () => new Response(null, { status: 204, headers: dHeaders }));
router.all('/api/questions', () => new Response(null, { status: 405, headers: qHeaders }));

// Teams
router.get('/api/teams', async (request) => await teamsGet(request));
router.put('/api/teams', async (request) => await teamsPut(request));
router.delete('/api/teams', async (request) => await teamsDel(request));
router.options('/api/teams', () => new Response(null, { status: 204, headers: tHeaders }));
router.all('/api/teams', () => new Response(null, { status: 405, headers: tHeaders }));

// Admin
router.put('/api/admin', async (request) => await addAdmin(request));
router.post('/api/admin', async (request) => await verifyAdmin(request));
router.options('/api/admin', () => new Response(null, { status: 204, headers: adHeaders }));
router.options('/api/admin', () => new Response(null, { status: 405, headers: adHeaders }));

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

addEventListener('fetch', (event) => event.respondWith(router.handle(event.request)));

// Validate that the client accepts the media type that the server expects
export function validateAccept(request, media = 'application/json') {
	if (!request || !request.headers)		return false;

	const acceptHeader = request.headers.get('Accept');

	if (!acceptHeader) return false;

	// Split the Accept header into individual media types
	const acceptedMediaTypes = acceptHeader.split(',');

	// Check if 'application/json' is present in the accepted media types
	return acceptedMediaTypes.some((mediaType) => mediaType.trim() === media);
}
