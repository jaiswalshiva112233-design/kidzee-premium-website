import assert from 'node:assert/strict';
import test from 'node:test';
import { phoneForwardingPlan, startWebsiteCallForwarding } from '../lib/marketing/phoneForwarding.ts';
const input={originalNumber:'+91 96670 38673',formattedNumber:'011 4000 1234',mobileNumber:'+911140001234'};
test('mobile call targets and visible numbers follow the Google number without changing button labels',()=>{
 const plan=phoneForwardingPlan(input);assert.equal(plan.href,'tel:+911140001234');
 assert.equal(plan.matches('tel:+919667038673'),true);assert.equal(plan.matches('tel:9667038673'),true);
 assert.equal(plan.matches('tel:+919000000000'),false);
 assert.equal(plan.replaceText('Call Admissions: +91 96670 38673'),'Call Admissions: 011 4000 1234');
 assert.equal(plan.replaceText('Call Admissions'),'Call Admissions');
 assert.equal(plan.replaceText('96670 38673'),'011 4000 1234');
});
test('invalid forwarding responses never replace the business telephone number',()=>{
 assert.equal(phoneForwardingPlan({...input,mobileNumber:'javascript:alert(1)'}),null);
 assert.equal(phoneForwardingPlan({...input,formattedNumber:'<script>bad</script>'}),null);
 assert.equal(phoneForwardingPlan({...input,originalNumber:'invalid'}),null);
});
test('newly rendered call links are updated, icons remain intact and withdrawal restores only our changes',t=>{
 let observeCallback;let disconnected=false;
 const previous=globalThis.MutationObserver;
 globalThis.MutationObserver=class{constructor(callback){observeCallback=callback}observe(){}disconnect(){disconnected=true}};
 t.after(()=>{globalThis.MutationObserver=previous});
 const make=(href,text)=>({href,child:{data:text},icon:{preserved:true},getAttribute(){return this.href},setAttribute(k,v){this.href=v}});
 const first=make('tel:+919667038673','Call +91 96670 38673');const other=make('tel:+919000000000','Other centre');const anchors=[first,other];
 const root={body:{},querySelectorAll:()=>anchors,createTreeWalker:anchor=>{let emitted=false;return{nextNode:()=>emitted?null:(emitted=true,anchor.child)}}};
 const restore=startWebsiteCallForwarding(input,root);
 assert.equal(first.href,'tel:+911140001234');assert.equal(first.child.data,'Call 011 4000 1234');assert.equal(first.icon.preserved,true);assert.equal(other.href,'tel:+919000000000');
 const later=make('tel:+919667038673','Book a call');anchors.push(later);observeCallback();assert.equal(later.href,'tel:+911140001234');assert.equal(later.child.data,'Book a call');
 first.child.data='New content from React';restore();assert.equal(disconnected,true);assert.equal(first.href,'tel:+919667038673');assert.equal(first.child.data,'New content from React');assert.equal(later.href,'tel:+919667038673');
});
