import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const web = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const load = p=>readFileSync(resolve(web,p),"utf8");

test("Session B Next.js preview imports actual Demo and scoped theme",()=>{
 const code=load("src/app/ui-lab/session-b/page.tsx");
 assert.match(code,/import DashboardCardsDemo from "@\/design\/pixel-pop\/workstreams\/dashboard\/Demo"/);
 assert.match(code,/import "@\/design\/pixel-pop\/pixel-pop.css"/);
 assert.match(code,/return <DashboardCardsDemo\/>/);
});

test("Integration is isolated from production root, auth and sources",()=>{
 const src=load("src/app/ui-lab/session-b/page.tsx");
 assert.doesNotMatch(src,/fetch\(|supabase|feishu\.cn|localStorage|process\.env/);
 assert.match(load("src/design/pixel-pop/workstreams/dashboard/Demo.tsx"),/演示数据（Demo）/);
});
