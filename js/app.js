/* js/app.js — client-side playlist fetch and UI */
(function(){
  const PLAYLIST_ID = window.PLAYLIST_ID || '';
  const listEl = document.getElementById('track-list');
  const apiInput = document.getElementById('api-key');
  const loadBtn = document.getElementById('load-list');
  const player = document.getElementById('yt-player');
  const toggleThemeBtn = document.getElementById('toggle-theme');

  function setTheme(theme){
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('timo-theme', theme);
  }

  toggleThemeBtn.addEventListener('click', ()=>{
    const cur = localStorage.getItem('timo-theme') || 'dark';
    setTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // initialize theme
  setTheme(localStorage.getItem('timo-theme') || 'dark');

  function setPlayerVideo(videoId, autoplay = true){
    if(!videoId) return;
    const auto = autoplay ? '1' : '0';
    player.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=${auto}&iv_load_policy=3`;
    window.scrollTo({top:0,behavior:'smooth'});
  }

  // Render a single track item
  function renderTrack(item){
    const li = document.createElement('li');
    li.className = 'track';
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = item.thumbnail || '';
    img.alt = item.title;
    const info = document.createElement('div');
    info.className = 'info';
    const t = document.createElement('p'); t.className = 'title'; t.textContent = item.title;
    const c = document.createElement('p'); c.className = 'channel'; c.textContent = item.channelTitle || '';
    info.appendChild(t); info.appendChild(c);
    li.appendChild(img); li.appendChild(info);
    li.addEventListener('click', ()=> setPlayerVideo(item.videoId));
    return li;
  }

  // Fetch playlist items via YouTube Data API v3 (client-side, requires API key)
  async function fetchPlaylistItems(apiKey){
    if(!apiKey) throw new Error('API key required');
    let items = [];
    let pageToken = '';
    const maxTries = 100; // safety
    try{
      do{
        const params = new URLSearchParams({
          part: 'snippet',
          playlistId: PLAYLIST_ID,
          maxResults: '50',
          key: apiKey,
        });
        if(pageToken) params.set('pageToken', pageToken);
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`;
        const res = await fetch(url);
        if(!res.ok){
          const txt = await res.text();
          throw new Error('YouTube API error: ' + res.status + ' — ' + txt);
        }
        const data = await res.json();
        (data.items || []).forEach(it => {
          const snip = it.snippet || {};
          items.push({
            videoId: snip.resourceId && snip.resourceId.videoId,
            title: snip.title,
            channelTitle: snip.videoOwnerChannelTitle || snip.channelTitle || '',
            thumbnail: (snip.thumbnails && (snip.thumbnails.medium || snip.thumbnails.default || snip.thumbnails.high))?.url || ''
          });
        });
        pageToken = data.nextPageToken || '';
      } while(pageToken);
    }catch(err){
      throw err;
    }
    return items;
  }

  async function loadAndRender(){
    const key = apiInput.value.trim();
    listEl.innerHTML = '';
    if(!key){
      const hint = document.createElement('p');
      hint.style.color = 'var(--muted)';
      hint.textContent = 'No API key provided — use the embedded player above to play the playlist. Paste a YouTube Data API v3 key and click "Load playlist details" to see titles and thumbnails.';
      listEl.appendChild(hint);
      return;
    }
    loadBtn.disabled = true; loadBtn.textContent = 'Loading...';
    try{
      const items = await fetchPlaylistItems(key);
      if(!items.length){
        const p = document.createElement('p'); p.style.color='var(--muted)'; p.textContent='No items found or playlist is private.'; listEl.appendChild(p);
      }else{
        items.forEach(it => listEl.appendChild(renderTrack(it)));
      }
    }catch(err){
      listEl.innerHTML = '';
      const p = document.createElement('p'); p.style.color='tomato'; p.textContent = 'Error loading playlist: ' + (err.message || err);
      listEl.appendChild(p);
      console.error(err);
    }finally{
      loadBtn.disabled = false; loadBtn.textContent = 'Load playlist details';
    }
  }

  loadBtn.addEventListener('click', loadAndRender);

  // On first load, show helpful note
  (function initialNotice(){
    const p = document.createElement('p'); p.style.color='var(--muted)'; p.textContent='Tip: No API key required to play; provide an API key to list titles and thumbnails in the UI.';
    listEl.appendChild(p);
  })();

})();
