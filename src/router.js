import { Router } from 'itty-router';
import { answerGet, answerOptions, answerPost } from './answers';
import { questionsGet } from './questions';
import { teamsOptions, teamsPut } from './teams';

const router = Router();

// Answers
router.get('/answers', async (request) => await answerGet(request));
router.post('/answers', (request) => answerPost(request));
router.options('/answers', () => answerOptions());

// Questions
router.get('/questions', (request) => questionsGet(request));

// Teams
router.put('/teams', async (request) => await teamsPut(request));
router.options('/teams', () => teamsOptions());

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

addEventListener('fetch', (event) => event.respondWith(router.handle(event.request)));
