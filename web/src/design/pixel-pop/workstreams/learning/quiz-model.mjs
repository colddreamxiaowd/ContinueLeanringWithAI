/** Per-question result idempotency. Retries are attempts, not new scored questions. */
export function createQuizSession(questionId){
  return {questionId:String(questionId),attempts:0,reported:false};
}
export function evaluateQuizAttempt(session,questionId,selectedId,correctId){
  const current=session.questionId===String(questionId)?session:createQuizSession(questionId);
  const correct=String(selectedId)===String(correctId);
  const next={questionId:String(questionId),attempts:current.attempts+1,reported:true};
  return {session:next,correct,attempt:next.attempts,shouldReport:!current.reported};
}
