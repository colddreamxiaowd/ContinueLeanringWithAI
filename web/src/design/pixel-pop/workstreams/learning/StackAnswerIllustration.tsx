import styles from "./learning.module.css";

/** Course-only artwork: used in the stack demo, never imported by generic AnswerFeedback. */
export function StackAnswerIllustration({stack}:{stack:readonly number[]}){
  const top=stack.at(-1);
  return <div className={styles.feedbackStack} aria-label={"栈从底到顶："+(stack.join("、")||"空")}>
    <span>栈顶 →</span><div className={styles.feedbackTower}>
      {stack.map((value,i)=><b key={i} className={i===stack.length-1?styles.feedbackTop:""}>{value}</b>)}
      {!stack.length&&<em>空栈</em>}
    </div>
    <small>当前栈顶：{top??"空"}</small>
  </div>;
}
