import { Router } from 'itty-router';
import { aHeaders, answerGet, answerPost } from './answers';
import { qHeaders, questionsGet } from './questions';
import { teamsPut, tHeaders } from './teams';

const router = Router();

// Answers
router.get('/api/answers', async (request) => await answerGet(request));
router.post('/api/answers', (request) => answerPost(request));
router.options('/api/answers', () => new Response(null, { status: 204, headers: aHeaders }));
router.all('/api/answers', () => new Response(null, { status: 406, headers: aHeaders }));

// Questions
router.get('/api/questions', async (request) => await questionsGet(request));
router.options('/api/questions', () => new Response(null, { status: 204, headers: qHeaders }));
router.all('/api/questions', () => new Response(null, { status: 406, headers: qHeaders }));

// Teams
router.put('/api/teams', async (request) => await teamsPut(request));
router.options('/api/teams', () => new Response(null, { status: 204, headers: tHeaders }));
router.all('/api/teams', () => new Response(null, { status: 406, headers: tHeaders }));

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

addEventListener('fetch', (event) => event.respondWith(router.handle(event.request)));
