import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import {LearningPractice} from "@/design/pixel-pop/workstreams/learning";
import type {QuizQuestion} from "@/design/pixel-pop/workstreams/learning";

export const metadata={
  title:"栈的基本操作 · 知序 Learning Hub",
  description:"全站框架中的真实栈实验与随堂练习；示例题仅供交互验收，不代表 CoursePack 数据。"
};
const questions:QuizQuestion[]=[
  {id:"session-d-stack-1",title:"执行以下操作后，栈顶元素是多少？",
    expression:"push(1), push(2), push(3), pop(), push(4)",
    options:[{id:"a",label:"1"},{id:"b",label:"2"},{id:"c",label:"3"},{id:"d",label:"4"}],
    correctOptionId:"d",difficulty:"中等",
    explanation:"依次入栈得到 [1, 2, 3]；弹出 3 后为 [1, 2]；最后压入 4，栈顶为 4。"},
  {id:"session-d-stack-2",title:"依次 Push(5)、Push(8)、Pop() 后，栈顶是什么？",
    expression:"push(5), push(8), pop()",
    options:[{id:"a",label:"5"},{id:"b",label:"8"},{id:"c",label:"0"},{id:"d",label:"空栈"}],
    correctOptionId:"a",difficulty:"简单",
    explanation:"根据后进先出原则，最晚入栈的 8 先被弹出，栈中还剩 [5]。"}
];
/** Integration QA surface. I owns this route; A owns ShellIntegrationFrame; D owns LearningPractice. */
export default function SessionDLearning(){
  return <ShellIntegrationFrame surface="practice"
    navigation={[
      {id:"courses",label:"学习中心",href:"/",icon:"courses"},
      {id:"practice",label:"实验与练习",href:"/ui-lab/session-d/learning",icon:"plan"}
    ]}
    crumbs={[
      {label:"学习中心",href:"/"},
      {label:"数据结构"},
      {label:"栈的基本操作"}
    ]}>
    <LearningPractice questions={questions} lessonTitle="栈的基本操作"/>
  </ShellIntegrationFrame>;
}
