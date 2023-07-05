import { Router } from 'itty-router';
import { answerGet, answerOptions, answerPost } from './answers';
import { questionsGet, questionsOptions } from './questions';
import { teamsOptions, teamsPut } from './teams';

const router = Router();

// Answers
router.get('/api/answers', async (request) => await answerGet(request));
router.post('/api/answers', (request) => answerPost(request));
router.options('/api/answers', () => answerOptions());

// Questions
router.get('/api/questions', (request) => questionsGet(request));
router.options('/api/questions', () => questionsOptions());

// Teams
router.put('/api/teams', async (request) => await teamsPut(request));
router.options('/api/teams', () => teamsOptions());

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

addEventListener('fetch', (event) => event.respondWith(router.handle(event.request)));
