// Example audio and timing are served from this repository.
document.querySelectorAll('audio').forEach(audio => audio.addEventListener('play', () => {
  document.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); });
}));

for (const root of document.querySelectorAll('[data-example-player]')) {
  fetch(root.dataset.examples).then(r => {
    if (!r.ok) throw Error('Could not load example data');
    return r.json();
  }).then(cases => {
    const select = root.querySelector('.example-select');
    function update() {
      const c = cases.find(c => c.id === select.value);
      root.querySelectorAll('audio').forEach(a => a.pause());
      root.querySelector('.example-source').textContent = c.source;
      root.querySelector('.example-question').textContent = c.question;
      root.querySelector('.example-correction').textContent = c.correction ? `Clarification during speech: “${c.correction}”` : '';
      root.querySelector('.example-answer').textContent = c.answer;
      root.querySelector('.conversation-audio').src = c.audio.conversation;
      root.querySelector('.model-audio').src = c.audio.played;
      if (c.guidance) {
        root.querySelector('.example-guidance').textContent = c.guidance;
        root.querySelector('.example-detail').textContent = `${c.policy === 'model' ? 'Model-triggered dispatch' : 'One explicitly forced dispatch'} · S2 ${c.s2_seconds.toFixed(3)} s · ${c.s2_tokens} completion tokens`;
      }
      const tracks = [];
      if (c.alignment) {
        tracks.push(['User audio', [{start: 0, end: c.alignment.user_audio_seconds}]]);
        tracks.push(['S2 request', c.alignment.s2.map(x => ({start:x.start_seconds, end:x.end_seconds, tone:'s2'}))]);
        tracks.push(['Speech', c.alignment.speech.map(x => ({start:x.start_seconds, end:x.end_seconds, tone:'speech'}))]);
        tracks.push(['Guidance', c.alignment.handoffs.map(x => ({start:x.at_seconds, end:x.at_seconds + .1, tone:'s2'}))]);
      } else {
        const events = c.events;
        tracks.push(['S1 requests', events.filter(x => x.lane === 'thinker').map(x => ({start:x.start,end:x.end}))]);
        tracks.push(['Speech path', events.filter(x => ['audio','talker'].includes(x.lane)).map(x => ({start:x.start,end:x.end,tone:'speech'}))]);
      }
      const end = Math.ceil(Math.max(1, ...tracks.flatMap(x => x[1].map(b => b.end))));
      const holder = root.querySelector('.example-timeline'); holder.replaceChildren();
      for (const [label,bars] of tracks) {
        const row = document.createElement('div'); row.className = 'timing-row';
        const name = document.createElement('span'); name.textContent = label;
        const track = document.createElement('div'); track.className = 'timing-track';
        track.setAttribute('role','img'); track.setAttribute('aria-label', `${label}: ${bars.length} captured intervals`);
        for (const b of bars) {
          const bar = document.createElement('span'); bar.className = 'timing-bar ' + (b.tone || '');
          bar.style.left = `${Math.max(0,b.start / end * 100)}%`;
          bar.style.width = `${Math.max(.25,(b.end-b.start) / end * 100)}%`;
          bar.title = `${label}: ${b.start.toFixed(3)}–${b.end.toFixed(3)} s`; track.append(bar);
        }
        row.append(name,track);holder.append(row);
      }
      const axis=document.createElement('div');axis.className='timing-axis';
      for (const value of [0,end/2,end]) { const span=document.createElement('span');span.textContent=`${value} s`;axis.append(span); }
      holder.append(axis);
    }
    select.addEventListener('change',update);update();
  }).catch(error => {
    const status=document.createElement('p'); status.setAttribute('role','status');
    status.textContent='Example timing could not load. The default audio remains available.';root.append(status);
    console.error(error);
  });
}
