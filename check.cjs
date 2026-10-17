const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let data={};
function boot(hash='',blockStorage=false){const events={},listeners={};const app={innerHTML:'',addEventListener:(name,fn)=>events[name]=fn,focus(){},querySelector:()=>({focus(){}})};const context={document:{querySelector:s=>s==='#app'?app:{focus(){},type:'search'}},location:{get hash(){return hash},set hash(v){hash=v.startsWith('#')?v:'#'+v}},window:{addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){}},localStorage:{getItem:k=>{if(blockStorage)throw Error();return data[k]||null},setItem:(k,v)=>{if(blockStorage)throw Error();data[k]=v}},console};vm.createContext(context);vm.runInContext(fs.readFileSync('data.js','utf8')+'\n'+fs.readFileSync('app.js','utf8'),context);return {context,app,click(dataset){events.click({target:{closest:()=>({dataset,disabled:false})}})},eval:code=>vm.runInContext(code,context)};}
let page=boot();assert.equal(page.eval('WORDS.length'),84);assert.equal(page.eval('SETS.length'),9);assert.equal(page.eval('SETS.flat().join(",")'),Array.from({length:84},(_,i)=>i).join(','));
assert(page.app.innerHTML.includes('84'));page.click({start:'0'});const first=page.eval('run.ids[0]');assert(!page.app.innerHTML.includes('ความหมายไทย:'));page.click({choice:String(first)});page.click({action:'check'});assert(page.app.innerHTML.includes('ความหมายไทย:'));page.click({action:'next'});page=boot('#quiz');assert.equal(page.eval('run.position'),1);assert.equal(page.eval('run.answers['+first+'].checked'),true);
// Complete every set with every answer correct: coverage, score totals, answer visibility and options.
for(let set=0;set<9;set++){page.click({start:String(set)});const ids=Array.from(page.eval('run.ids'));for(const id of ids){const choices=Array.from(page.eval('run.choices['+id+']'));assert.equal(choices.length,4);assert.equal(new Set(choices).size,4);assert(choices.includes(id));page.click({choice:String(id)});page.click({action:'check'});page.click({action:'next'});}assert.equal(page.eval('saved.scores['+set+'].best'),ids.length);assert.equal(page.eval('saved.active'),null);assert(page.app.innerHTML.includes('เฉลยครบทุกข้อ'));}assert.equal(page.eval('Object.values(saved.scores).reduce((n,s)=>n+s.best,0)'),84);
// Wrong-answer retry includes only missed words; retry never overwrites a full-set best.
page.click({start:'8'});const ids=Array.from(page.eval('run.ids'));for(const [i,id]of ids.entries()){const selected=i===0?Array.from(page.eval('run.choices['+id+']')).find(c=>c!==id):id;page.click({choice:String(selected)});page.click({action:'check'});page.click({action:'next'});}page.click({action:'retry'});assert.equal(page.eval('run.ids.length'),1);assert.equal(page.eval('run.ids[0]'),ids[0]);page.click({choice:String(ids[0])});page.click({action:'check'});page.click({action:'next'});assert.equal(page.eval('saved.scores[8].best'),4);
// Fresh reload + corrupt storage + disabled storage must all remain usable.
assert(boot().app.innerHTML.includes('84'));data={'word-garden-v2':'invalid json'};assert(boot().app.innerHTML.includes('เลือกชุดฝึก'));assert(boot('',true).app.innerHTML.includes('ไม่สามารถบันทึก'));
const words=require('./data.js');for(const w of words)for(const key of ['word','read','meaning','meaningRead','thai'])assert(w[key],w.word+': '+key);
console.log('PASS: 84 pairs, 9 sets, four distinct options, scoring, feedback, resume, wrong-only retry, score retention, storage failures and required readings.');

// Custom vocabulary validation, full-list distractors, safe text, edit persistence and dataset reset.
data={};page=boot();
const custom=[{word:'bright',meaning:'radiant',thai:'สว่าง'},{word:'quick',meaning:'rapid',thai:'เร็ว'},{word:'small',meaning:'tiny',thai:'เล็ก'},{word:'silent',meaning:'quiet',thai:'เงียบ'},{word:'happy',meaning:'joyful',thai:'มีความสุข'}];
page.context.custom=custom;assert.equal(page.eval('replaceWords(custom)'),true);assert.equal(page.eval('WORDS.length'),5);assert.equal(page.eval('SETS.length'),1);assert.equal(page.eval('saved.active'),null);
page=boot();assert.equal(page.eval('WORDS[0].word'),'bright');assert.equal(page.eval('options(0).length'),4);assert(page.eval('Array.from({length:100},()=>options(0)).flat().includes(4)'));
page.context.short=custom.slice(0,3);assert(page.eval('validateWords(short).error'));
page.context.duplicate=[...custom,{word:'new',meaning:'QUIET',thai:'ซ้ำ'}];assert(page.eval('validateWords(duplicate).error'));
page.eval("search='<img>';location.hash='#words';render()");assert(!page.app.innerHTML.includes('value="<img>'));
page.eval("location.hash='#edit';render()");assert(page.app.innerHTML.includes('คำศัพท์ 1'));assert(page.app.innerHTML.includes('คำศัพท์ 2'));
page.click({action:'edit-word',id:'0'});
const entries={word:'brilliant',meaning:'radiant',thai:'สดใส',read:'บริลเลียนท์',meaningRead:'เรเดียนท์',note:'test'};
page.context.mockForm={elements:{namedItem:k=>({value:entries[k]})}};page.eval('saveWordForm(mockForm)');assert.equal(page.eval('WORDS[0].word'),'brilliant');
page.click({action:'delete-word',id:'4'});assert.equal(page.eval('WORDS.length'),4);page.click({action:'delete-word',id:'3'});assert.equal(page.eval('WORDS.length'),4);assert(page.eval('editorError.length>0'));
page.click({action:'export-words'});assert(page.eval('JSON.parse(transferText).words.length===4'));page.click({action:'import-words'});assert.equal(page.eval('WORDS.length'),4);
console.log('PASS: custom CRUD, minimum size, duplicate rejection, complete-list random distractors, persistence, backup import/export and escaped user text.');

// Restart shuffles each category, includes every word once, survives reload, even if RNG repeats.
data={};page=boot();page.eval('Math.random=()=>0');
for(let set=0;set<9;set++){
 let previous=null;
 for(let round=0;round<4;round++){
  page.click({start:String(set)});const order=Array.from(page.eval('run.ids'));
  assert.equal(new Set(order).size,order.length);
  assert.deepEqual([...order].sort((a,b)=>a-b),Array.from(page.eval('SETS['+set+']')));
  if(previous&&order.length>1){assert.notDeepEqual(order,previous);assert.notEqual(order[0],previous[0]);}
  previous=order;page=boot('#quiz');
 }
}
page.click({start:'0'});const activeBefore=JSON.stringify(page.eval('saved.active'));const scoreBefore=JSON.stringify(page.eval('saved.scores'));const cacheBefore=data['word-garden-v2'];
page.click({action:'surprise'});assert.equal(page.eval('run.mode'),'surprise');assert(!page.app.innerHTML.includes('progressbar'));assert(!page.app.innerHTML.includes('ดูคะแนนและเฉลย'));
let last=null;
for(let cycle=0;cycle<3;cycle++){
 const seen=new Set();
 for(let i=0;i<84;i++){
  const id=page.eval('run.ids[0]');assert(!seen.has(id));if(last!==null)assert.notEqual(id,last);seen.add(id);
  page.click({choice:String(id)});page.click({action:'check'});assert(page.app.innerHTML.includes('ความหมายไทย:'));page.click({action:'next'});
  assert.equal(page.eval('Object.keys(run.answers).length'),0);assert.equal(page.eval('Object.keys(run.choices).length'),1);last=id;
 }
 assert.equal(seen.size,84);
}
assert.equal(JSON.stringify(page.eval('saved.scores')),scoreBefore);assert.equal(JSON.stringify(page.eval('saved.active')),activeBefore);assert.equal(data['word-garden-v2'],cacheBefore);
page.click({action:'resume'});assert.equal(JSON.stringify(page.eval('run')),activeBefore);
// Newly added personal vocabulary survives reboot and appears in Surprise's full pool.
page.context.custom=custom;assert(page.eval('replaceWords(custom)'));page=boot('#surprise');const customSeen=new Set();for(let i=0;i<5;i++){customSeen.add(page.eval('WORDS[run.ids[0]].word'));page.eval('nextSurprise()');}assert.equal(customSeen.size,5);assert(customSeen.has('happy'));assert.equal(boot().eval('WORDS.length'),5);
console.log('PASS: repeat-resistant category shuffle across restarts, 3 complete Surprise cycles, bounded memory, no saved scores/answers, preserved standard session, cached custom words in Surprise.');
