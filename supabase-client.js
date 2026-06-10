/**
 * Supabase Client - Resilient, won't crash if CDN fails
 */
var COUPLE_ID = '00000000-0000-0000-0000-000000000010';
var GAB_ID = '00000000-0000-0000-0000-000000000001';
var AVI_ID = '00000000-0000-0000-0000-000000000002';

var config = window.SUPABASE_CONFIG || {
    url: 'https://tdlsgxoiaxauswarjzjg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbHNneG9pYXhhdXN3YXJqempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDczNzYsImV4cCI6MjA5NTk4MzM3Nn0.FsrzIeojP3P1SwUuIglm9dmt8hJI8OF_MS8m9nv5v2E'
};

var supabaseConfigured = config.url !== 'https://your-project-id.supabase.co' && config.anonKey !== 'your-anon-key-here';

// Guard: if Supabase JS library didn't load, set no-op functions and continue
if (typeof supabase === 'undefined') {
    console.warn('supabase-js CDN not available, running without cloud sync');
    window._supabaseReady = false;
    window.loadFromSupabase = function(state) { return Promise.resolve(false); };
    window.saveToSupabase = function(state) { return Promise.resolve(false); };
    window.supabase = null;
    window.COUPLE_ID = COUPLE_ID;
} else {
    var supabaseClient = supabase.createClient(config.url, config.anonKey);
    window.supabase = supabaseClient;
    window._supabaseReady = supabaseConfigured;
    window.COUPLE_ID = COUPLE_ID;

    window.loadFromSupabase = async function(state) {
        if (!supabaseConfigured) return false;
        var anyData = false;
        var sb = supabaseClient;
        try { var r = await sb.from('couples').select('*').eq('id', COUPLE_ID).maybeSingle(); if (r.data) { state.couple.name1 = r.data.name1; state.couple.name2 = r.data.name2; state.couple.startDate = r.data.start_date; anyData = true; } } catch(e) {}
        try { var r = await sb.from('notes').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.notes = r.data.map(function(n) { return { id: n.id, title: n.title, body: n.content, date: (n.created_at || '').split('T')[0] }; }); anyData = true; } } catch(e) {}
        try { var r = await sb.from('goals').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.goals = r.data.map(function(g) { return { id: g.id, emoji: g.emoji, title: g.title, type: g.type, progress: g.progress || 0, target: g.target || 100, deadline: g.deadline || null, milestones: [], items: [], createdAt: '' }; }); anyData = true; } } catch(e) { console.warn('goals load fail:', e.message); }
        try { var r = await sb.from('events').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.events = r.data.map(function(e) { return { emoji: e.emoji, title: e.title, date: e.date }; }); anyData = true; } } catch(e) {}
        try { var r = await sb.from('trips').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.trips = r.data.map(function(t) { return { name: t.name, budget: t.budget, spent: t.spent || 0, startDate: t.start_date, endDate: t.end_date, checklist: [], itinerary: [] }; }); anyData = true; } } catch(e) {}
        try { var r = await sb.from('memories').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.memories = r.data.map(function(m) { return { emoji: m.emoji, title: m.title, story: m.story, location: m.location, date: m.date, image: m.image_url, category: m.category || 'photos' }; }); anyData = true; } } catch(e) {}
        try { var r = await sb.from('answers').select('*').eq('couple_id', COUPLE_ID).order('created_at', { ascending: true }); if (r.data && r.data.length) { state.answeredQuestions = r.data.map(function(a) { return { question: a.question_text, answer: a.answer, date: (a.created_at || '').split('T')[0], by: a.created_by || 'Gab' }; }); anyData = true; } } catch(e) {}
        try { var r = await sb.from('questions').select('*').eq('couple_id', COUPLE_ID).maybeSingle(); if (r.data) { state.currentQuestion = r.data.current_index || 0; anyData = true; } } catch(e) {}
        try { var r = await sb.from('mood_settings').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data[0]) { state.mood.customMoods = r.data[0].custom_moods; anyData = true; } } catch(e) {}
        return anyData;
    };

    window.saveToSupabase = async function(state) {
        if (!supabaseConfigured) return false;
        var sb = supabaseClient;
        try { var ec = await sb.from('couples').select('id').eq('id', COUPLE_ID).maybeSingle(); if (ec.data) { await sb.from('couples').update({ name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate }).eq('id', COUPLE_ID); } else { await sb.from('couples').insert({ id: COUPLE_ID, user1_id: GAB_ID, user2_id: AVI_ID, name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate }); } } catch(e) {}
        try { if (state.goals.length > 0) { await sb.from('goals').delete().eq('couple_id', COUPLE_ID); await sb.from('goals').insert(state.goals.map(function(g) { return { id: g.id, couple_id: COUPLE_ID, emoji: g.emoji || 'star', title: g.title, type: g.type || 'count', progress: g.progress || 0, target: g.target || 100, deadline: g.deadline || null, milestones: '[]', items: '[]', created_at: new Date().toISOString() }; })); } } catch(e) { console.warn('goals save fail:', e.message); }
        try { if (state.notes.length > 0) { await sb.from('notes').delete().eq('couple_id', COUPLE_ID); await sb.from('notes').insert(state.notes.map(function(n) { return { couple_id: COUPLE_ID, title: n.title || 'Untitled', content: n.body || '', created_by: GAB_ID, created_at: n.date ? n.date + 'T00:00:00' : new Date().toISOString() }; })); } } catch(e) { console.warn('notes save fail:', e.message); }
        try { if (state.events.length > 0) { await sb.from('events').delete().eq('couple_id', COUPLE_ID); await sb.from('events').insert(state.events.map(function(e) { return { couple_id: COUPLE_ID, emoji: e.emoji || 'star', title: e.title, date: e.date }; })); } } catch(e) {}
        try { if (state.trips.length > 0) { await sb.from('trips').delete().eq('couple_id', COUPLE_ID); await sb.from('trips').insert(state.trips.map(function(t) { return { couple_id: COUPLE_ID, name: t.name, budget: t.budget || 0, spent: t.spent || 0, checklist: '[]', itinerary: '[]', start_date: t.startDate || null, end_date: t.endDate || null }; })); } } catch(e) {}
        try { if (state.memories.length > 0) { await sb.from('memories').delete().eq('couple_id', COUPLE_ID); await sb.from('memories').insert(state.memories.map(function(m) { return { couple_id: COUPLE_ID, title: m.title, story: m.story || '', emoji: m.emoji || 'star', image_url: m.image || null, location: m.location || null, date: m.date, category: m.category || 'photos' }; })); } } catch(e) {}
        try { await sb.from('mood_settings').delete().eq('couple_id', COUPLE_ID); await sb.from('mood_settings').insert({ couple_id: COUPLE_ID, custom_moods: JSON.stringify(state.mood.customMoods || ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited']), selected_person: state.mood.selectedPerson || state.couple.name1 }); } catch(e) {}
        try { await sb.from('answers').delete().eq('couple_id', COUPLE_ID); if (state.answeredQuestions.length > 0) { await sb.from('answers').insert(state.answeredQuestions.map(function(a) { return { couple_id: COUPLE_ID, question_id: '00000000-0000-0000-0000-000000000020', question_text: a.question, answer: a.answer, created_by: a.by || 'Gab', created_at: a.date ? a.date + 'T00:00:00' : new Date().toISOString() }; })); } } catch(e) {}
        try { await sb.from('questions').delete().eq('couple_id', COUPLE_ID); await sb.from('questions').insert({ couple_id: COUPLE_ID, current_index: state.currentQuestion || 0 }); } catch(e) {}
        return true;
    };
}

console.log('[SUPABASE] Ready:', window._supabaseReady);