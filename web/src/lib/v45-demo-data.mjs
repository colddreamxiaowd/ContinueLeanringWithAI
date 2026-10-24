// Bundled V4.5 synthetic fixtures: Workers do not expose the Next.js
// source directory as a runtime filesystem. Static imports are compiled into
// the server bundle and are safe for Node, Next and Cloudflare workerd.
import demoIndex from "../data/v45-demo/index.json" with {type:"json"};
import matrixFixture from "../data/v45-demo/documents/27b4dc73c54fc7cc9504445ba88a4ba396591092e5281d04fbaf561d29ccf77c.json" with {type:"json"};
import stackFixture from "../data/v45-demo/documents/f05ff8e4ec66639c252aedf3037f701ba222284ba9860b260819d4a28fca61cb.json" with {type:"json"};

const FIXTURES=new Map([
 [matrixFixture.document_id,matrixFixture],
 [stackFixture.document_id,stackFixture],
]);
export function readDemoIndex(){
 if(demoIndex?.schema_version!=="v45-demo-v1"||
    !Array.isArray(demoIndex.documents))throw new Error("V45_DEMO_INDEX_INVALID");
 return demoIndex;
}
export function readDemoDocument(documentId){
 const entry=readDemoIndex().documents.find(item=>item.document_id===documentId);
 if(!entry)return null;
 const document=FIXTURES.get(documentId);
 if(!document||
   document.schema_version!=="v45-demo-v1"||
   document.document_id!==documentId||
   document.source_sha256!==entry.source_sha256)return null;
 return document;
}
