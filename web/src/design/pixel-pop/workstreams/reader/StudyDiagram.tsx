"use client";
/** Native-editable SVG artwork, no embedded PNG, remote image, animation or font dependency. */
export function StudyDiagram({kind="stack"}:{kind?:"stack"|"queue"}){
  if(kind==="queue")return <svg viewBox="0 0 700 250" role="img" aria-label="A、B、C 依次入队，A 最先从队首离开" xmlns="http://www.w3.org/2000/svg">
    <title>先进先出 FIFO</title><rect width="700" height="250" fill="#E9F1FF"/>
    <g stroke="#12121D" strokeWidth="4"><rect x="85" y="95" width="140" height="80" rx="8" fill="#FFE342"/>
      <rect x="236" y="95" width="140" height="80" rx="8" fill="#24DBA6"/>
      <rect x="387" y="95" width="140" height="80" rx="8" fill="#7440FF"/>
      <path d="M63 134H18M40 116L18 134L40 152M549 134H670M648 116L670 134L648 152" fill="none" stroke="#246BFF" strokeWidth="7"/></g>
    <g fontSize="42" fontWeight="900" textAnchor="middle" fontFamily="system-ui" fill="#12121D"><text x="155" y="150">A</text><text x="305" y="150">B</text><text x="455" y="150" fill="#fff">C</text></g>
    <g fontSize="18" fontWeight="900" fill="#12121D" fontFamily="system-ui"><text x="85" y="65">FRONT · 队首</text><text x="410" y="65">REAR · 队尾</text><text x="85" y="219">先进入的 A，最先离开</text></g>
  </svg>;
  return <svg viewBox="0 0 700 250" role="img" aria-label="自下而上依次放入 1、2、3，最上层 3 先被弹出" xmlns="http://www.w3.org/2000/svg">
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
  </svg>;
}
