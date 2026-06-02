// supabase-sync.js - Standalone Supabase sync wrapper
// Runs alongside the original script.js without modifying it
(function() {
  const GAB_ID = '00000000-0000-0000-0000-000000000001';
  const AVI_ID = '00000000-0000-0000-0000-000000000002';
  const COUPLE_ID = '00000000-0000-0000-0000-000000000010';

  async function loadFromSupabase(state) {
    if (!window.supabase) { console.log('No Supabase client'); return false; }
    try {
      const sb = window.supabase;
      const [eventsR, memoriesR, notesR, listsR, tripsR, periodR, coupleR, moodsR] = await Promise.all([
        sb.from('events').select('*').eq('couple_id', COUPLE_ID).timeout(5000),
        sb.from('memories').select('*').eq('couple_id', COUPLE_ID).timeout(5000),
        sb.from('notes').select('*').eq('couple_id', COUPLE_ID).timeout(5000),
        sb.from('lists').select('*').eq('couple_id', COUPLE_ID).timeout(5000),
        sb.from('trips').select('*').eq('couple_id', COUPLE_ID).timeout(5000),
        sb.from('period_entries').select('*').eq('couple_id', COUPLE_ID).timeout(5000),
        sb.from('couples').select('*').eq('id', COUPLE_ID).timeout(5000),
        sb.from('mood_settings').select('*').eq('couple_id', COUPLE_ID).timeout(5000)
      ]);
      if (coupleR.data && coupleR.data[0]) {
        state.couple.name1 = coupleR.data[0].name1;
        state.couple.name2 = coupleR.data[0].name2;
        state.couple.startDate = coupleR.data[0].start_date;
      }
      if (eventsR.data && eventsR.data.length) state.events = eventsR.data.map(e => ({ emoji: e.emoji, title: e.title, date: e.date }));
      if (memoriesR.data && memoriesR.data.length) state.memories = memoriesR.data.map(m => ({ emoji: m.emoji, title: m.title, story: m.story, location: m.location, date: m.date, image: m.image_url }));
      if (notesR.data && notesR.data.length) state.notes = notesR.data.map(n => ({ id: n.id, title: n.title, body: n.content, date: (n.created_at || '').split('T')[0] }));
      if (tripsR.data && tripsR.data.length) state.trips = tripsR.data.map(t => ({ name: t.name, budget: t.budget, spent: t.spent, startDate: t.start_date, endDate: t.end_date, checklist: typeof t.checklist === 'string' ? JSON.parse(t.checklist) : (t.checklist || []), itinerary: typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : (t.itinerary || []) }));
      if (periodR.data && periodR.data.length) state.periodTracker.entries = periodR.data.map(p => ({ id: p.id, date: p.date, periodLength: p.period_length, flow: p.flow, symptoms: typeof p.symptoms === 'string' ? JSON.parse(p.symptoms) : (p.symptoms || []), note: p.note }));
      if (listsR.data && listsR.data.length) listsR.data.forEach(list => { state.lists[list.list_type] = typeof list.items === 'string' ? JSON.parse(list.items) : (list.items || []); });
      if (moodsR.data && moodsR.data[0]) state.mood.customMoods = typeof moodsR.data[0].custom_moods === 'string' ? JSON.parse(moodsR.data[0].custom_moods) : (moodsR.data[0].custom_moods || state.mood.customMoods);
      console.log('Loaded from Supabase!');
      return true;
    } catch (e) { console.error('Supabase load error:', e.message); return false; }
  }

  async function syncToSupabase(state) {
    if (!window.supabase) return;
    const sb = window.supabase;
    try {
      const { data: existing } = await sb.from('couples').select('id').eq('id', COUPLE_ID);
      if (existing && existing.length > 0) {
        await sb.from('couples').update({ name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate }).eq('id', COUPLE_ID);
      } else {
        await sb.from('couples').insert({ id: COUPLE_ID, user1_id: GAB_ID, user2_id: AVI_ID, name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate });
      }
      await sb.from('events').delete().eq('couple_id', COUPLE_ID);
      if (state.events.length > 0) await sb.from('events').insert(state.events.map(e => ({ emoji: e.emoji, title: e.title, date: e.date, couple_id: COUPLE_ID })));
      await sb.from('memories').delete().eq('couple_id', COUPLE_ID);
      if (state.memories.length > 0) await sb.from('memories').insert(state.memories.map(m => ({ title: m.title, story: m.story, emoji: m.emoji, image_url: m.image, location: m.location, date: m.date, category: m.category || 'photos', couple_id: COUPLE_ID })));
      await sb.from('notes').delete().eq('couple_id', COUPLE_ID);
      if (state.notes.length > 0) await sb.from('notes').insert(state.notes.map(n => ({ id: n.id, title: n.title, content: n.body, created_by: GAB_ID, couple_id: COUPLE_ID, created_at: n.date ? n.date + 'T00:00:00' : new Date().toISOString() })));
      for (const [listType, items] of Object.entries(state.lists)) {
        await sb.from('lists').delete().eq('couple_id', COUPLE_ID).eq('list_type', listType);
        if (items.length > 0) await sb.from('lists').insert({ couple_id: COUPLE_ID, list_type: listType, items: JSON.stringify(items) });
      }
      await sb.from('trips').delete().eq('couple_id', COUPLE_ID);
      if (state.trips.length > 0) await sb.from('trips').insert(state.trips.map(t => ({ name: t.name, budget: t.budget, spent: t.spent || 0, start_date: t.startDate || null, end_date: t.endDate || null, checklist: JSON.stringify(t.checklist || []), itinerary: JSON.stringify(t.itinerary || []), couple_id: COUPLE_ID })));
      await sb.from('period_entries').delete().eq('couple_id', COUPLE_ID);
      if (state.periodTracker.entries.length > 0) await sb.from('period_entries').insert(state.periodTracker.entries.map(e => ({ date: e.date, period_length: e.periodLength || e.period_length, flow: e.flow, symptoms: JSON.stringify(e.symptoms || []), note: e.note || '', user_id: GAB_ID, couple_id: COUPLE_ID })));
      await sb.from('mood_settings').delete().eq('couple_id', COUPLE_ID);
      await sb.from('mood_settings').insert({ couple_id: COUPLE_ID, custom_moods: JSON.stringify(state.mood.customMoods) });
      console.log('Saved to Supabase!');
    } catch (e) { console.error('Supabase save error:', e.message); }
  }

  // Hook into GAVVY by monkey-patching save and init
  function patchGAVVY() {
    if (!window.GAVVY) { setTimeout(patchGAVVY, 200); return; }
    
    const origInit = window.GAVVY.init;
    window.GAVVY.init = async function() {
      // Check if Supabase is available
      if (typeof window.SUPABASE_CONFIG !== 'undefined' && window.SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co' && window.supabase) {
        window._supabaseReady = true;
      }
      // Call original init
      origInit.call(window.GAVVY);
      // Now try to load from Supabase and patch the save function
      try {
        const state = getGavvyState();
        if (state && window._supabaseReady) {
          const loaded = await loadFromSupabase(state);
          if (loaded) {
            // Patch save to also sync to Supabase
            window._origSave = window._gavvySave;
            patchSave(state);
          }
        }
      } catch(e) { console.warn('Supabase sync init error:', e.message); }
    };
  }

  // Get access to the internal state
  function getGavvyState() {
    try {
      // The state is inside the closure, we need another way to access it
      // The save function already has access to state via closure
      // We'll use a different approach: patch save() to intercept
      return null;
    } catch(e) { return null; }
  }

  function patchSave(state) {
    // Override localStorage save to also sync to Supabase
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      origSetItem(key, value);
      if (key === 'gavvy-state' && window._supabaseReady) {
        try {
          const parsed = JSON.parse(value);
          syncToSupabase(parsed);
        } catch(e) {}
      }
    };
    console.log('Supabase sync active!');
  }

  // Alternative simpler approach: just patch localStorage
  // Also patch load to load from Supabase when localStorage is empty
  function initSync() {
    if (typeof window.SUPABASE_CONFIG === 'undefined' || window.SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co') {
      console.log('Supabase not configured, skipping sync');
      return;
    }
    
    window._supabaseReady = true;
    
    // Patch localStorage.setItem to also sync to Supabase
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      origSetItem(key, value);
      if (key === 'gavvy-state' && window._supabaseReady && window.supabase) {
        try {
          const state = JSON.parse(value);
          syncToSupabase(state);
        } catch(e) {}
      }
    };
    
    // Patch localStorage.getItem to load from Supabase when data is empty
    const origGetItem = localStorage.getItem.bind(localStorage);
    localStorage.getItem = function(key) {
      const val = origGetItem(key);
      if (key === 'gavvy-state' && window._supabaseReady && window.supabase) {
        // If localStorage is empty, load from Supabase
        if (!val) {
          setTimeout(async () => {
            try {
              // Create a temp state object to load into
              const tempState = { couple: { name1: 'Gab', name2: 'Avi' }, events: [], memories: [], notes: [], trips: [], lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] }, periodTracker: { entries: [] }, mood: { customMoods: [] }, goals: [], answeredQuestions: [] };
              const loaded = await loadFromSupabase(tempState);
              if (loaded) {
                // Write to localStorage so GAVVY picks it up
                origSetItem(key, JSON.stringify(tempState));
                console.log('Loaded data from Supabase cloud!');
                // Reload the page to pick up the new data
                location.reload();
              }
            } catch(e) { console.error('Supabase load error:', e.message); }
          }, 100);
        }
      }
      return val;
    };
    
    console.log('Supabase sync active!');
  }

  initSync();
})();