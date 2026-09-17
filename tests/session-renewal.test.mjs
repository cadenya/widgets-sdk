import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { CadenyaWidgets, APIError, Stream } from '../dist/index.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const credentials={sessionId:'wsess_test',host:'widget.widgets.test',token:'new-widget-token',tokenExpiresAt:'2026-09-17T20:15:00Z',sessionExpiresAt:'2026-09-18T20:00:00Z'};

test('renewal requires workspace and exposes credential/reason types without a session ID parameter',()=>{
 const temp=mkdtempSync(join(tmpdir(),'widgets-renewal-types-'));
 try {
  const file=join(temp,'renewal.mts');
  writeFileSync(file,`
import type { CadenyaWidgets, WidgetSessionCredentials, WidgetSessionErrorReason } from ${JSON.stringify(join(root,'dist/index.js'))};
declare const client: CadenyaWidgets;
const response: PromiseLike<WidgetSessionCredentials> = client.session.renewWidget({workspaceId:'workspace'});
// @ts-expect-error workspace is required
client.session.renewWidget({});
// @ts-expect-error session identity comes from bearer only
client.session.renewWidget({workspaceId:'workspace',sessionId:'session'});
const reasons: WidgetSessionErrorReason[] = ['TOKEN_EXPIRED','SESSION_REVOKED','SESSION_EXPIRED','SESSION_EXHAUSTED'];
`);
  const result=spawnSync('tsc',['--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','--lib','ES2022,DOM,DOM.Iterable',file],{encoding:'utf8'});
  assert.ifError(result.error); assert.equal(result.status,0,result.stdout+result.stderr);
 } finally {rmSync(temp,{recursive:true,force:true});}
});

test('renewal uses widget bearer, required workspace, and no session ID or browser User-Agent',async()=>{
 let sent;
 const originalProcess=globalThis.process;
 let client;
 try {
  globalThis.process=undefined;
  client=new CadenyaWidgets({apiKey:'existing-widget-token',baseURL:'https://widget.widgets.test',fetch:async(url,init)=>{
   sent={url:String(url),method:init.method,body:init.body,headers:new Headers(init.headers)};
   return new Response(JSON.stringify(credentials),{headers:{'content-type':'application/json','cache-control':'no-store'}});
  }});
 } finally {globalThis.process=originalProcess;}
 const result=await client.session.renewWidget({workspaceId:'workspace_test',sessionId:'ignored'});
 assert.equal(sent.url,'https://widget.widgets.test/v1/workspaces/workspace_test/session:renew');
 assert.equal(sent.method,'POST'); assert.equal(sent.body,undefined);
 assert.equal(sent.headers.get('authorization'),'Bearer existing-widget-token');
 assert.equal(sent.headers.has('user-agent'),false);
 assert.deepEqual(result,credentials);
 assert.equal('widgetSessions' in client,false);
});

test('renewal preserves structured expiry, revocation, exhaustion, and retry details',async()=>{
 for(const [http,code,reason] of [[401,16,'TOKEN_EXPIRED'],[403,7,'SESSION_REVOKED'],[403,7,'SESSION_EXPIRED'],[429,8,'SESSION_EXHAUSTED'],[429,8,'RATE_LIMITED']]) {
  const details=[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',domain:'api.cadenya.com',reason}];
  if(reason==='RATE_LIMITED')details.push({'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'4s'});
  let calls=0;
  const client=new CadenyaWidgets({apiKey:'test-token',baseURL:'https://widget.widgets.test',fetch:async()=>{
   calls++;return new Response(JSON.stringify({code,message:reason,details}),{status:http,headers:{'content-type':'application/json'}});
  }});
  await assert.rejects(client.session.renewWidget({workspaceId:'workspace'}),error=>{
   assert.ok(error instanceof APIError);assert.equal(error.status,http);assert.equal(error.code,code);assert.deepEqual(error.details,details);return true;
  });
  assert.equal(calls,1);
 }
});

test('session-ended remains visible without advancing the durable resume checkpoint',async()=>{
 const failure={code:7,message:'revoked',details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'SESSION_REVOKED',domain:'api.cadenya.com'}]};
 const stream=new Stream(new Response('event: session-ended\ndata: '+JSON.stringify(failure)+'\n\n'),undefined,'objevt_previous',['open','ping']);
 const events=[]; for await(const event of stream)events.push(event);
 assert.deepEqual(events,[failure]);assert.equal(stream.lastEventId,'objevt_previous');
});
