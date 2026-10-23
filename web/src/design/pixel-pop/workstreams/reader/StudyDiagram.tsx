"use client";
/** Native-editable SVG artwork, no embedded PNG, remote image, animation or font dependency. */
import s from "./reader.module.css";
export function StudyDiagram({kind="stack"}:{kind?:"stack"|"queue"}){
  if(kind==="queue")return <><svg className={s.diagramDesktop} viewBox="0 0 700 250" role="img" aria-label="A、B、C 依次入队，A 最先从队首离开" xmlns="http://www.w3.org/2000/svg">
    <title>先进先出 FIFO</title><rect width="700" height="250" fill="#E9F1FF"/>
    <g stroke="#12121D" strokeWidth="4"><rect x="85" y="95" width="140" height="80" rx="8" fill="#FFE342"/>
      <rect x="236" y="95" width="140" height="80" rx="8" fill="#24DBA6"/>
      <rect x="387" y="95" width="140" height="80" rx="8" fill="#7440FF"/>
      <path d="M63 134H18M40 116L18 134L40 152M549 134H670M648 116L670 134L648 152" fill="none" stroke="#246BFF" strokeWidth="7"/></g>
    <g fontSize="42" fontWeight="900" textAnchor="middle" fontFamily="system-ui" fill="#12121D"><text x="155" y="150">A</text><text x="305" y="150">B</text><text x="455" y="150" fill="#fff">C</text></g>
    <g fontSize="18" fontWeight="900" fill="#12121D" fontFamily="system-ui"><text x="85" y="65">FRONT · 队首</text><text x="410" y="65">REAR · 队尾</text><text x="85" y="219">先进入的 A，最先离开</text></g>
  </svg><svg className={s.diagramMobile} viewBox="0 0 360 300" role="img" aria-label="队首 A 先出队；队尾 C 最后入队" xmlns="http://www.w3.org/2000/svg">
    <title>移动端队列示意 · FIFO</title><rect width="360" height="300" fill="#E9F1FF"/>
    <g fill="#12121D" fontFamily="system-ui" fontWeight="900" fontSize="18"><text x="22" y="56">队首 FRONT</text><text x="220" y="56">队尾 REAR</text></g>
    <g stroke="#12121D" strokeWidth="3"><rect x="20" y="84" width="97" height="84" rx="7" fill="#FFE342"/><rect x="131" y="84" width="97" height="84" rx="7" fill="#24DBA6"/><rect x="242" y="84" width="97" height="84" rx="7" fill="#7440FF"/></g>
    <g fill="#12121D" fontSize="35" fontFamily="system-ui" fontWeight="900" textAnchor="middle"><text x="68" y="138">A</text><text x="179" y="138">B</text><text x="290" y="138" fill="#fff">C</text></g>
    <path d="M39 205H318M297 187L318 205L297 223" stroke="#246BFF" strokeWidth="6" fill="none"/>
    <g fill="#12121D" fontFamily="system-ui" fontSize="18" fontWeight="850"><text x="20" y="257">FIFO · 先进先出</text><text x="20" y="281" fontSize="16">最先入队的 A 最先离开</text></g>
  </svg></>;
  return <><svg className={s.diagramDesktop} viewBox="0 0 700 250" role="img" aria-label="自下而上依次放入 1、2、3，最上层 3 先被弹出" xmlns="http://www.w3.org/2000/svg">
    <title>后进先出 LIFO</title><desc>蓝色底块 1、红色中块 2、紫色顶块 3，栈顶位于上方</desc>
    <rect width="700" height="250" fill="#E9F1FF"/>
    <g stroke="#12121D" strokeWidth="4" strokeLinejoin="round">
      <path d="M275 163H425L457 146H307Z" fill="#174DE3"/><path d="M275 163H425V226H275Z" fill="#246BFF"/><path d="M425 163L457 146V209L425 226Z" fill="#163CA4"/>
      <path d="M275 99H425L457 82H307Z" fill="#FFB2C0"/><path d="M275 99H425V161H275Z" fill="#FF6E75"/><path d="M425 99L457 82V144L425 161Z" fill="#CE415C"/>
      <path d="M275 35H425L457 18H307Z" fill="#AB81FF"/><path d="M275 35H425V97H275Z" fill="#7440FF"/><path d="M425 35L457 18V80L425 97Z" fill="#522AC0"/>
      <rect x="42" y="34" width="123" height="55" rx="8" fill="#FFE342"/><path d="M170 62H252M234 47L252 62L234 77" fill="none" strokeWidth="6"/>
      <rect x="500" y="76" width="177" height="103" rx="9" fill="#fff"/></g>
    <g fontFamily="system-ui" fontWeight="900" textAnchor="middle" fontSize="42" fill="#fff"><text x="349" y="81">3</text><text x="349" y="145">2</text><text x="349" y="209">1</text></g>
    <g fontFamily="system-ui" fill="#12121D"><text x="103" y="60" fontSize="20" fontWeight="900" textAnchor="middle">栈顶</text><text x="103" y="79" fontSize="12" textAnchor="middle">TOP</text><text x="518" y="115" fontSize="25" fontWeight="900">LIFO</text><text x="518" y="143" fontSize="15" fontWeight="800">后进先出</text><text x="518" y="164" fontSize="11">最晚进入的 3 先离开</text></g>
  </svg><svg className={s.diagramMobile} viewBox="0 0 360 310" role="img" aria-label="三个堆叠的方块，最上层 3 最先出栈" xmlns="http://www.w3.org/2000/svg">
    <title>移动端栈示意 · LIFO</title><rect width="360" height="310" fill="#E9F1FF"/>
    <rect x="17" y="35" width="101" height="58" rx="8" stroke="#12121D" strokeWidth="3" fill="#FFE342"/>
    <g fontFamily="system-ui" fill="#12121D" fontWeight="900" textAnchor="middle"><text x="68" y="62" fontSize="21">栈顶</text><text x="68" y="82" fontSize="16">TOP</text></g>
    <path d="M120 65H142M133 56L142 65L133 74" stroke="#12121D" strokeWidth="4" fill="none"/>
    <g stroke="#12121D" strokeWidth="3" strokeLinejoin="round">
      <rect x="151" y="31" width="95" height="59" rx="3" fill="#7440FF"/>
      <rect x="151" y="92" width="95" height="59" rx="3" fill="#FF6E75"/>
      <rect x="151" y="153" width="95" height="59" rx="3" fill="#246BFF"/>
    </g>
    <g fontFamily="system-ui" fontSize="37" fontWeight="900" fill="#fff" textAnchor="middle"><text x="198" y="75">3</text><text x="198" y="137">2</text><text x="198" y="199">1</text></g>
    <rect x="264" y="78" width="83" height="89" rx="7" stroke="#12121D" strokeWidth="3" fill="#fff"/>
    <g fontFamily="system-ui" fontWeight="900" fill="#12121D"><text x="276" y="115" fontSize="21">LIFO</text><text x="273" y="145" fontSize="17">后进先出</text></g>
    <rect x="17" y="236" width="330" height="57" rx="8" fill="#fff" stroke="#AEC9F0" strokeWidth="2"/>
    <g fontFamily="system-ui" fontSize="17" fill="#12121D"><text x="29" y="261" fontWeight="900">先放入 1 → 2 → 3</text><text x="29" y="284">取出时 3 最先离开</text></g>
  </svg></>;
}
