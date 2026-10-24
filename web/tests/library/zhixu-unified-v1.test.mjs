import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {validateCoursePack} from "../../src/lib/coursepack.mjs";
const root=resolve(fileURLToPath(new URL("../../",import.meta.url)));
const read=p=>readFileSync(resolve(root,p),"utf8");
test("A shell is shared across three real Next.js route files",()=>{
 const shell=read("src/app/ui-lab/integrated/IntegratedShell.tsx");
 const layout=read("src/app/ui-lab/integrated/layout.tsx");
 for(const page of ["home","reader","practice"]){
  assert.ok(shell.includes("/ui-lab/integrated/"+page));
  assert.ok(read("src/app/ui-lab/integrated/"+page+"/page.tsx").includes('data-integrated-page="'+page+'"'));
 }
 assert.match(layout,/IntegratedShell/);assert.match(shell,/ShellIntegrationFrame/);
 assert.match(shell,/presentation="app"/);
});
test("the integration reuses B/C/D real components",()=>{
 const home=read("src/app/ui-lab/integrated/home/page.tsx");
 for(const c of ["CourseHero","CourseProgressCard","SourceFileCard","StudyTaskCard"])assert.ok(home.includes(c));
 assert.match(read("src/app/ui-lab/integrated/reader/page.tsx"),/ReaderDemo embedded/);
 assert.match(read("src/app/ui-lab/integrated/practice/page.tsx"),/LearningPractice/);
});
test("existing private Feishu/CoursePack and real WASM experiment routes remain present",()=>{
 for(const f of ["src/app/coursepacks/page.tsx","src/app/experiments/page.tsx","src/app/read/[slug]/page.tsx"])
  assert.ok(read(f).length>200);
});
test("actual CoursePack v0.1 validator accepts equivalent synthetic teaching blocks",()=>{
 const input={schemaVersion:"0.1",visibility:"private",title:"数据结构",description:"合成示例",version:1,
 sourceRefs:[{id:"s1",fileName:"演示讲义.pptx",locator:"第 12 页"}],
 chapters:[{id:"c1",title:"栈",blocks:[
  {id:"p1",type:"explanation",markdown:"后进先出",sourceRefIds:["s1"]},
  {id:"q1",type:"quiz",prompt:"栈顶是哪一个",options:["1","2"],answerIndex:1,hint:"2"}]}]};
 assert.equal(validateCoursePack(input).ok,true);
 assert.match(read("src/app/ui-lab/integrated/layout.tsx"),/validateCoursePack\(DEMO_COURSEPACK\)/);
});
