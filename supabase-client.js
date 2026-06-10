/**
 * Supabase Client - Resilient sync for all devices
 * Each table is fetched/saved individually so one failure doesn't kill everything
 */
const COUPLE_ID = '00000000-0000-0000-0000-000000000010';
const GAB_ID = '00000000-0000-0000-0000-000000000001';
const AVI_ID = '00000000-0000-0000-0000-000000000002';

const config = window.SUPABASE_CONFIG || {
    url: 'https://tdlsgxoiaxauswarjzjg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbHNneG9pYXhhdXN3YXJqempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDczNzYsImV4cCI6MjA5NTk4MzM3Nn0.FsrzIeojP3P1SwUuIglm9dmt8hJI8OF_MS8m9nv5v2E'
};

if (typeof supabase === 'undefined') { console.error('[SUPABASE] Library not loaded!'); }

const { createClient } = supabase;
const supabaseClient = createClient(config.url, config.anonKey);
window.supabase = supabaseClient;

const supabaseConfigured = config.url !== 'https://your-project-id.supabase.co' &&
    config.anonKey !== 'your-anon-key-here';

async function loadFromSupabase(state) {
    if (!supabaseConfigured) return false;
    let anyData = false;
    
    // Fetch each table individually so one failure doesn't kill all
    // Couple info
    try { const r = await supabaseClient.from('couples').select('*').eq('id', COUPLE_ID).maybeSingle(); if (r.data) { state.couple.name1 = r.data.name1; state.couple.name2 = r.data.name2; state.couple.startDate = r.data.start_date; anyData = true; } } catch(e) {}
    // Events
    try { const r = await supabaseClient.from('events').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.events = r.data.map(e => ({ emoji: e.emoji, title: e.title, date: e.date })); anyData = true; } } catch(e) {}
    // Memories
    try { const r = await supabaseClient.from('memories').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.memories = r.data.map(m => ({ emoji: m.emoji, title: m.title, story: m.story || m.text, location: m.location, date: m.date, image: m.image_url, category: m.category || 'photos' })); anyData = true; } } catch(e) {}
    // Notes
    try { const r = await supabaseClient.from('notes').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.notes = r.data.map(n => ({ id: n.id, title: n.title, body: n.content, date: (n.created_at || '').split('T')[0] })); anyData = true; } } catch(e) {}
    // Trips
    try { const r = await supabaseClient.from('trips').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.trips = r.data.map(t => ({ name: t.name, budget: t.budget, spent: t.spent || 0, startDate: t.start_date, endDate: t.end_date, checklist: typeof t.checklist === 'string' ? JSON.parse(t.checklist) : (t.checklist || []), itinerary: typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : (t.itinerary || []) })); anyData = true; } } catch(e) {}
    // Goals
    try { const r = await supabaseClient.from('goals').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.goals = r.data.map(g => ({ id: g.id, emoji: g.emoji, title: g.title, type: g.type, progress: g.progress || 0, target: g.target, deadline: g.deadline || null, milestones: typeof g.milestones === 'string' ? JSON.parse(g.milestones) : (g.milestones || []), items: typeof g.items === 'string' ? JSON.parse(g.items) : (g.items || []), createdAt: g.created_at ? g.created_at.split('T')[0] : new Date().toISOString().split('T')[0] })); anyData = true; } } catch(e) { console.warn('[SUPABASE] goals query:', e.message); }
    // Period
    try { const r = await supabaseClient.from('period_entries').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { state.periodTracker.entries = r.data.map(p => ({ id: p.id, date: p.date, periodLength: p.period_length, flow: p.flow, symptoms: typeof p.symptoms === 'string' ? JSON.parse(p.symptoms) : (p.symptoms || []), note: p.note })); const sorted = [...state.periodTracker.entries].sort((a, b) => new Date(b.date) - new Date(a.date)); state.periodTracker.lastPeriodDate = sorted[0].date; state.periodTracker.periodLength = sorted[0].periodLength; anyData = true; } } catch(e) {}
    // Lists
    try { const r = await supabaseClient.from('lists').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data.length) { r.data.forEach(list => { state.lists[list.list_type] = typeof list.items === 'string' ? JSON.parse(list.items) : (list.items || []); }); anyData = true; } } catch(e) {}
    // Mood settings
    try { const r = await supabaseClient.from('mood_settings').select('*').eq('couple_id', COUPLE_ID); if (r.data && r.data[0]) { state.mood.customMoods = typeof r.data[0].custom_moods === 'string' ? JSON.parse(r.data[0].custom_moods) : (r.data[0].custom_moods || state.mood.customMoods); if (r.data[0].mood_gab) state.mood.current[state.couple.name1 || 'Gab'] = r.data[0].mood_gab; if (r.data[0].mood_avi) state.mood.current[state.couple.name2 || 'Avi'] = r.data[0].mood_avi; if (r.data[0].selected_person) state.mood.selectedPerson = r.data[0].selected_person; anyData = true; } } catch(e) { console.warn('[SUPABASE] mood_settings:', e.message); }
    // Answers
    try { const r = await supabaseClient.from('answers').select('*').eq('couple_id', COUPLE_ID).order('created_at', { ascending: true }); if (r.data && r.data.length) { state.answeredQuestions = r.data.map(a => ({ question: a.question_text, answer: a.answer, date: (a.created_at || '').split('T')[0], by: a.created_by || 'Gab' })); anyData = true; } } catch(e) { console.warn('[SUPABASE] answers:', e.message); }
    // Current question index
    try { const r = await supabaseClient.from('questions').select('*').eq('couple_id', COUPLE_ID).maybeSingle(); if (r.data) { state.currentQuestion = r.data.current_index || 0; anyData = true; } } catch(e) { console.warn('[SUPABASE] questions:', e.message); }

    console.log('[SUPABASE] Loaded, had data:', anyData);
    return anyData;
}

async function saveToSupabase(state) {
    if (!supabaseConfigured) return false;
    // Save each table individually
    try {
        const { data: ec } = await supabaseClient.from('couples').select('id').eq('id', COUPLE_ID).maybeSingle();
        if (ec) { await supabaseClient.from('couples').update({ name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate }).eq('id', COUPLE_ID); }
        else { await supabaseClient.from('couples').insert({ id: COUPLE_ID, user1_id: GAB_ID, user2_id: AVI_ID, name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate }); }
    } catch(e) { console.warn('[SUPABASE] couple:', e.message); }
    
    try { if (state.events.length > 0) { await supabaseClient.from('events').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('events').insert(state.events.map(e => ({ couple_id: COUPLE_ID, emoji: e.emoji || 'emoji', title: e.title, date: e.date }))); } } catch(e) { console.warn('[SUPABASE] events:', e.message); }
    try { if (state.memories.length > 0) { await supabaseClient.from('memories').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('memories').insert(state.memories.map(m => ({ couple_id: COUPLE_ID, title: m.title, story: m.story || m.text || '', emoji: m.emoji || 'image', image_url: m.image || null, location: m.location || null, date: m.date, category: m.category || 'photos' }))); } } catch(e) { console.warn('[SUPABASE] memories:', e.message); }
    try { if (state.notes.length > 0) { await supabaseClient.from('notes').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('notes').insert(state.notes.map(n => ({ couple_id: COUPLE_ID, title: n.title || 'Untitled', content: n.body || '', created_by: GAB_ID, created_at: n.date ? n.date + 'T00:00:00' : new Date().toISOString() }))); } } catch(e) { console.warn('[SUPABASE] notes:', e.message); }
    try { for (const [listType, items] of Object.entries(state.lists)) { if (items.length > 0) { await supabaseClient.from('lists').delete().eq('couple_id', COUPLE_ID).eq('list_type', listType); await supabaseClient.from('lists').insert({ couple_id: COUPLE_ID, list_type: listType, items: JSON.stringify(items) }); } } } catch(e) { console.warn('[SUPABASE] lists:', e.message); }
    try { if (state.trips.length > 0) { await supabaseClient.from('trips').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('trips').insert(state.trips.map(t => ({ couple_id: COUPLE_ID, name: t.name, budget: t.budget || 0, spent: t.spent || 0, checklist: JSON.stringify(t.checklist || []), itinerary: JSON.stringify(t.itinerary || []), start_date: t.startDate || null, end_date: t.endDate || null }))); } } catch(e) { console.warn('[SUPABASE] trips:', e.message); }
    try { if (state.periodTracker.entries.length > 0) { await supabaseClient.from('period_entries').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('period_entries').insert(state.periodTracker.entries.map(e => ({ couple_id: COUPLE_ID, user_id: GAB_ID, date: e.date, period_length: e.periodLength || e.period_length, flow: e.flow || 'normal', symptoms: JSON.stringify(e.symptoms || []), note: e.note || '' }))); } } catch(e) { console.warn('[SUPABASE] period:', e.message); }
    try { if (state.goals.length > 0) { await supabaseClient.from('goals').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('goals').insert(state.goals.map(g => ({ id: g.id, couple_id: COUPLE_ID, emoji: g.emoji || 'sparkle', title: g.title, type: g.type || 'count', progress: g.progress || 0, target: g.target || 100, deadline: g.deadline || null, milestones: JSON.stringify(g.milestones || []), items: JSON.stringify(g.items || []), created_at: g.createdAt ? g.createdAt + 'T00:00:00' : new Date().toISOString() }))); } } catch(e) { console.warn('[SUPABASE] goals:', e.message); }
    try { await supabaseClient.from('mood_settings').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('mood_settings').insert({ couple_id: COUPLE_ID, custom_moods: JSON.stringify(state.mood.customMoods || ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited']), selected_person: state.mood.selectedPerson || state.couple.name1, mood_gab: state.mood.current[state.couple.name1] || null, mood_avi: state.mood.current[state.couple.name2] || null }); } catch(e) { console.warn('[SUPABASE] mood:', e.message); }
    try { await supabaseClient.from('answers').delete().eq('couple_id', COUPLE_ID); if (state.answeredQuestions.length > 0) { await supabaseClient.from('answers').insert(state.answeredQuestions.map(a => ({ couple_id: COUPLE_ID, question_id: '00000000-0000-0000-0000-000000000020', question_text: a.question, answer: a.answer, created_by: a.by || 'Gab', created_at: a.date ? a.date + 'T00:00:00' : new Date().toISOString() }))); } } catch(e) { console.warn('[SUPABASE] answers:', e.message); }
    try { await supabaseClient.from('questions').delete().eq('couple_id', COUPLE_ID); await supabaseClient.from('questions').insert({ couple_id: COUPLE_ID, current_index: state.currentQuestion || 0 }); } catch(e) { console.warn('[SUPABASE] questions:', e.message); }

    return true;
}

window._supabaseReady = supabaseConfigured;
window.loadFromSupabase = loadFromSupabase;
window.saveToSupabase = saveToSupabase;
window.COUPLE_ID = COUPLE_ID;

console.log('[SUPABASE] Ready:', supabaseConfigured);