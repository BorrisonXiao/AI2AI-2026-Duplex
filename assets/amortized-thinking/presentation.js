(()=>{
const $=id=>document.getElementById(id), make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const state={case:'shared-folder',textMethod:'current_notes',audioMethod:'function_notes',stage:0};
const descriptions={
 reactive:['Reactive','The thinker receives the available original history and the new request; no earlier generated notes are supplied.'],
 current_notes:['Function notes','A question-blind Instruct writer edits structured facts, owners, status and source IDs; the final text thinker receives the current state with the full transcript.'],
 function_notes:['Function notes','The same audio backbone writes notes from earlier speech and uses its current note state together with the original audio when answering.'],
 quotes_current:['Source quotes','The program copies the transcript passages cited by the current note state; generated fact text, owner/status labels and note IDs are omitted from the extra view.'],
 quotes_history:['Quotes + earlier evidence','The extra view includes current source passages and earlier source IDs from versions of still-active notes; the full transcript remains available.'],
 overview_topics:['Function notes + topic overview','Periodic function calls maintain one broad theme and one current focus; the final call adds this overview to detailed notes and the full history.'],
 overview_topics_speakers:['Function notes + topics and speakers','The overview also records each speaker’s supported name, role and contribution, plus explicit relationships; earlier versions remain saved.'],
 overview_topics_speakers_voice:['Function notes + topics, speakers and voice','The audio writer also records audible delivery or tentative affect; the final call adds these overview entries to detailed notes and the original speech.']
};
let examples,results;
const pretty=x=>JSON.stringify(x,null,2), current=()=>examples.cases.find(c=>c.id===state.case);
function detail(title,value){const d=make('details');d.append(make('summary',title),make('pre',typeof value==='string'?value:pretty(value)));return d;}
function pause(){document.querySelectorAll('audio').forEach(a=>a.pause());}
function audio(title,url,caption){const box=make('article',undefined,'audio-choice');box.append(make('h3',title));if(caption)box.append(make('p',caption,'meta'));const a=make('audio');a.controls=true;a.preload='metadata';a.src=url;a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(other=>{if(other!==a)other.pause();}));box.append(a);return box;}
function drawSource(){
 const c=current(),host=$('source-example');host.replaceChildren();host.append(make('h3',c.question,'example-title'),make('p',c.meeting+' · request at '+(c.insertion_seconds/60).toFixed(2)+' minutes.'));
 const grid=make('div',undefined,'audio-grid');
 if(c.id==='shared-folder')grid.append(audio('Source evidence',c.audio.evidence.url,'115.5–155.5 seconds: reported upload and limited visibility.'));
 else{grid.append(audio('Earlier capacity',c.audio['earlier-capacity'].url,'673.5–699.0 seconds: the earlier 36-talk maximum.'));grid.append(audio('Revised capacity',c.audio['revised-capacity'].url,'760.5–812.5 seconds: a morning/afternoon for posters and 30 talks.'));}
 grid.append(audio('Recent history + inserted question',c.audio['recent-input'].url,'The last 30 seconds before the request, followed by the actual synthesized question used in evaluation.'));
 host.append(grid,make('p','Reference answer: '+c.reference));
 const src=make('details');src.append(make('summary','Read the supporting transcript'));
 c.source_evidence.forEach(u=>{const p=make('p',undefined,'source-utterance');p.append(make('strong',u.speaker+' · '+u.start.toFixed(2)+' s · '+u.id),make('span',' — '+u.text));src.append(p);});host.append(src);
 const full=make('details');full.append(make('summary','Full model-input recording, standalone question and complete reference transcript'),audio('Full history + request',c.audio['full-input'].url,'All source history up to the request, followed by the inserted question; model prompts provide segment boundaries separately.'),audio('Question only',c.audio.question.url,'Speaker-matched synthetic speech, beginning with the wake word “Assistant”.'),detail('Complete reference transcript',c.transcript));host.append(full);
}
function showTrace(branch){
 const text=branch==='text',method=state[text?'textMethod':'audioMethod'],model=$(text?'text-model':'audio-model').value;
 const identity=text?'ground_truth_transcript':$('audio-identity').value,period=$(text?'text-period':'audio-period').value;
 const overview=method.startsWith('overview_'),condition=overview?method+'_p'+period:method;
 $(text?'text-period':'audio-period').disabled=!overview;
 document.querySelectorAll('.setting-button[data-branch='+branch+']').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.method===method)));
 const contract=$(branch+'-contract');contract.replaceChildren(make('h3',descriptions[method][0]),make('p',descriptions[method][1]));
 const r=examples.traces.find(t=>t.case===state.case&&t.model===model&&t.identity===identity&&t.condition===condition);
 const host=$(branch+'-example');host.replaceChildren();if(!r){host.append(make('p','No recorded example for this combination.'));return;}
 host.append(make('p',r.study==='pilot8'?'Eight-question overview pilot · source-checked example':'Completed 105-question comparison · recorded example','trace-study'));
 host.append(make('h3','1. Input to the thinker'),make('p',text?'Full speaker-labelled reference transcript + participant’s request in text.':'Original meeting audio + spoken participant request'+(identity==='labelled_voices'?' + labelled past voice examples.':'.')));
 const p=r.prompt;
 if(text){
  host.append(detail('Executed system and user prompt',p.messages));
 }else{
  const instruction=p.system.split(' Current saved notes: ')[0];
  host.append(detail('Executed instructions before saved notes',instruction),detail('Full executed native prompt and audio-slot metadata',{prompt:p.native_prompt,audio_slots:p.audio_slots}));
 }
 host.append(make('h3','2. Saved view supplied to this answer'));
 if(method==='reactive')host.append(make('p','No generated saved view is included.'));
 else{
  if(p.saved_view!==null&&p.saved_view!==undefined)host.append(detail(method.startsWith('quotes_')?'Actual copied source passages':'Actual current detailed notes',p.saved_view));
  if(p.overview)host.append(detail('Actual current conversation overview',p.overview));
  if(!p.saved_view&&!p.overview)host.append(detail('Saved material in the recorded instruction',p.system));
  if(r.overview_source_cutoff)host.append(make('p','The latest supplied overview uses only speech before '+r.overview_source_cutoff.toFixed(1)+' seconds.','meta'));
 }
 host.append(make('h3','3. Actual final answer'),make('blockquote',r.answer||'[No final answer text]','trace-answer'));
 const score=r.score.supported_correct?'fully supported':r.score.core_correct?'required facts present; unsupported extra claim':'does not meet the full reference checklist';
 const review=r.score_status.toLowerCase().includes('source')?'Codex source review':r.score_status.includes('empty')?'empty-answer check':'provisional LLM judgment';
 host.append(make('p','Recorded evaluation: '+score+' · '+review+'.','meta'));
 if(state.case==='poster-session')host.append(make('p',examples.scoring_note,'meta'));
 const thinking=r.thinking_tokens===null?(model==='minicpm'?'disabled in this setup':'not exposed'):r.thinking_tokens.toLocaleString()+' tokens';
 host.append(make('p','Request-time thinking: '+thinking+'; first answer text: '+(r.first_answer_seconds===null?'not used for timing comparison':r.first_answer_seconds.toFixed(2)+' seconds')+'.','trace-metrics'));
}
function drawVoices(){const host=$('voice-examples');host.replaceChildren();if($('audio-identity').value!=='labelled_voices')return;const d=make('details');d.append(make('summary','Hear the labelled past voice examples supplied to the model'));const g=make('div',undefined,'voice-grid');current().voice_examples.forEach(v=>g.append(audio('Speaker '+v.speaker,v.audio,'Source '+v.source_start.toFixed(2)+'–'+v.source_end.toFixed(2)+' s; before the request.')));d.append(g);host.append(d);}
function drawEvents(){
 const [branch,model]=$('event-model').value.split('|'),host=$('note-events');host.replaceChildren();
 const events=examples.note_events.filter(r=>r.branch===branch&&r.model===model&&r.meeting===current().meeting).sort((a,b)=>a.cutoff-b.cutoff);
 events.forEach(r=>{const a=make('article',undefined,'writer-event');a.append(make('h3','Recorded update at '+r.cutoff.toFixed(1)+' seconds'),make('p','The writer has not received the later participant question.'));
  if(r.audio_input)a.append(audio('Audio actually supplied to this writer call',r.audio_input,'Clips are concatenated in the recorded prompt order; repeated recent context is retained.'));
  a.append(detail('Writer input prompt',r.messages||r.prompt),make('h4','Generated function calls'),make('pre',pretty(r.operations)),detail('Program results for those calls',r.receipts),detail('Actual saved state after accepted edits',r.saved_state_after));host.append(a);});
 if(!events.length)host.append(make('p','No selected writer update for this example.'));
}
function drawPilot(){
 const model=$('pilot-model').value,select=$('pilot-identity');
 const audio=model==='minicpm'||model==='qwen-thinking';
 if(audio&&select.value==='ground_truth_transcript')select.value='audio_only';if(!audio)select.value='ground_truth_transcript';select.disabled=!audio;
 const rows=results.pilot.summary.filter(r=>r.model===model&&r.identity===select.value).sort((a,b)=>(a.condition==='reactive'?-2:a.condition==='function_notes'?-1:0)-(b.condition==='reactive'?-2:b.condition==='function_notes'?-1:0)||a.condition.localeCompare(b.condition));
 const host=$('pilot-all');host.replaceChildren();const wrapper=make('div',undefined,'table-wrap'),table=make('table'),caption=make('p','Table 6. All tested settings for the selected thinker and speaker input; eight source-checked questions per row, with mean thinking and first-text time.');caption.className='asset-label';caption.id='table-caption-6';table.setAttribute('aria-labelledby',caption.id);host.append(caption);
 const tr=make('tr');['Condition','Fully supported','Thinking tokens','First text (s)','Complete generation'].forEach(h=>{const n=make('th',h);n.scope='col';tr.append(n);});const head=make('thead');head.append(tr);table.append(head);const body=make('tbody');
 rows.forEach(r=>{const tr=make('tr'),name=r.condition.replace('overview_','+ ').replace('_p',' / ').replaceAll('_',' ');const time=model==='instruct'?'Excluded':r.first_answer_seconds_mean.toFixed(2)+(r.first_answer_timed<8?' ('+r.first_answer_timed+'/8 timed)':'');[name,r.supported+'/8',r.thinking_tokens_mean===null?'—':Math.round(r.thinking_tokens_mean).toLocaleString(),time,r.cost.complete_generated_tokens.toLocaleString()].forEach(x=>tr.append(make('td',x)));body.append(tr);});table.append(body);wrapper.append(table);host.append(wrapper);
}
function render(){drawSource();showTrace('text');showTrace('audio');drawVoices();drawEvents();drawPilot();}
const stages=Array.from(document.querySelectorAll('.talk-stage'));
function present(on,index){pause();document.body.classList.toggle('presenting',on);$('present-controls').hidden=!on;if(index!==undefined)state.stage=Math.max(0,Math.min(stages.length-1,index));stages.forEach((s,i)=>s.hidden=on&&i!==state.stage);$('stage-count').textContent=(state.stage+1)+' / '+stages.length;$('previous-stage').disabled=state.stage===0;$('next-stage').disabled=state.stage===stages.length-1;if(on){stages[state.stage].tabIndex=-1;stages[state.stage].focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});}
$('present-toggle').addEventListener('click',()=>present(true,0));$('exit-present').addEventListener('click',()=>present(false));$('previous-stage').addEventListener('click',()=>present(true,state.stage-1));$('next-stage').addEventListener('click',()=>present(true,state.stage+1));
document.addEventListener('keydown',e=>{if(!document.body.classList.contains('presenting'))return;if(e.key==='Escape'){present(false);return;}if(e.target.closest('select,input,textarea,audio,summary,button'))return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();present(true,state.stage+1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();present(true,state.stage-1);}});
function reveal(){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(!target)return;if(document.body.classList.contains('presenting'))present(false);for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));}addEventListener('hashchange',reveal);
Promise.all(['examples.json','results.json'].map(async name=>{const r=await fetch('data/amortized-thinking/'+name);if(!r.ok)throw Error('HTTP '+r.status);return r.json();})).then(([e,r])=>{examples=e;results=r;render();
 $('example-case').addEventListener('change',()=>{pause();state.case=$('example-case').value;render();});
 for(const id of ['text-model','text-period'])$(id).addEventListener('change',()=>showTrace('text'));
 for(const id of ['audio-model','audio-period','audio-identity'])$(id).addEventListener('change',()=>{pause();showTrace('audio');drawVoices();});
 document.querySelectorAll('.setting-button').forEach(b=>b.addEventListener('click',()=>{state[b.dataset.branch==='text'?'textMethod':'audioMethod']=b.dataset.method;showTrace(b.dataset.branch);}));
 $('event-model').addEventListener('change',drawEvents);['pilot-model','pilot-identity'].forEach(id=>$(id).addEventListener('change',drawPilot));
 $('function-definitions').append(detail('Detailed-note functions and instructions',examples.fine_functions),detail('Overview functions and instructions',examples.overview_functions));
 $('data-status').textContent='';reveal();
}).catch(error=>{$('data-status').textContent='Example data could not load: '+error.message;console.error(error);});
})();
