import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Stream } from '../dist/core/sse.js';

test('heartbeat is delivered without advancing the durable reconnect checkpoint', async () => {
 const heartbeat = {id:'hb_pulse', metadata:{id:'hb_pulse'}, type:'heartbeat', heartbeat:{}};
 const frames = 'event: open\ndata: {}\n\nid: objevt_durable\nevent: stateChanged\ndata: {"type":"stateChanged"}\n\nevent: heartbeat\ndata: '+JSON.stringify(heartbeat)+'\n\nevent: ping\ndata: {}\n\n';
 const stream = new Stream(new Response(frames), undefined, undefined, ['open','ping']);
 const events = [];
 for await (const event of stream) events.push(event);
 assert.deepEqual(events, [{type:'stateChanged'}, heartbeat]);
 assert.equal(stream.lastEventId, 'objevt_durable');
});

test('heartbeat-only connection preserves its supplied resume point', async () => {
 const stream = new Stream(new Response('event: heartbeat\ndata: {"type":"heartbeat"}\n\n'), undefined, 'objevt_previous', ['open','ping']);
 for await (const event of stream) assert.equal(event.type, 'heartbeat');
 assert.equal(stream.lastEventId, 'objevt_previous');
});
