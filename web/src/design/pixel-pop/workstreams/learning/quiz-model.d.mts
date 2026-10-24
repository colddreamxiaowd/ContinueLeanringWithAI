export type QuizSession={questionId:string;attempts:number;reported:boolean};
export function createQuizSession(questionId:string):QuizSession;
export function evaluateQuizAttempt(session:QuizSession,questionId:string,selectedId:string,correctId:string):{
  session:QuizSession;correct:boolean;attempt:number;shouldReport:boolean
};
