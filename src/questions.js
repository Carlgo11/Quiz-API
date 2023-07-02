import { validateJWT } from './tokens'

async function getAvailableQuestions(questionDB) {
    try {
        let questions = {}
        for (const k of (await questionDB.list({prefix: 'question:', type: 'json'})).keys) {
            const question = await questionDB.get(k.name, {type: 'json'})
            questions[(k.name).replace('question:','')] = question.options
        }
        return questions
    } catch (error) {
        console.log(error)
    }
    return {};
}

// GET request
export async function questionsGet(request) {
    const questionDB = QUESTIONS;
    const userDB = USERS;
    const user = await validateJWT(request, userDB)
    if (!user) return new Response(null, {status: 401})
    return new Response(JSON.stringify(await getAvailableQuestions(questionDB)))
}
