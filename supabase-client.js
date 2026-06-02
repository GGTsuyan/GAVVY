/**
 * Supabase Client Configuration and Database Service Layer
 * for Love Website Generator
 * 
 * This file provides a complete database abstraction layer that replaces
 * localStorage and the Python backend with Supabase.
 */

// Import Supabase JS client (add to your HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>)

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_CONFIG = {
    // Replace these with your actual Supabase project credentials
    // Get these from: Supabase Dashboard > Settings > API
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};

// ============================================
// INITIALIZE SUPABASE CLIENT
// ============================================

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// ============================================
// DATABASE SERVICE LAYER
// ============================================

const DatabaseService = {
    // ----------------------------------------
    // AUTHENTICATION
    // ----------------------------------------
    
    /**
     * Sign up a new user
     */
    async signUp(email, password, metadata = {}) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Sign in a user
     */
    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Sign out current user
     */
    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },
    
    /**
     * Get current session
     */
    async getSession() {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return session;
    },
    
    /**
     * Get current user
     */
    async getCurrentUser() {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return user;
    },
    
    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(callback);
    },
    
    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get user profile
     */
    async getProfile(userId) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
    },
    
    // ----------------------------------------
    // COUPLES
    // ----------------------------------------
    
    /**
     * Create a new couple relationship
     */
    async createCouple(user1Id, user2Id, name1, name2, startDate) {
        const { data, error } = await supabaseClient
            .from('couples')
            .insert([{
                user1_id: user1Id,
                user2_id: user2Id,
                name1,
                name2,
                start_date: startDate
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get couple by user ID
     */
    async getCoupleByUserId(userId) {
        const { data, error } = await supabaseClient
            .from('couples')
            .select('*')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },
    
    /**
     * Update couple
     */
    async updateCouple(coupleId, updates) {
        const { data, error } = await supabaseClient
            .from('couples')
            .update(updates)
            .eq('id', coupleId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // ----------------------------------------
    // MEMORIES
    // ----------------------------------------
    
    /**
     * Add a new memory
     */
    async addMemory(coupleId, memory) {
        const { data, error } = await supabaseClient
            .from('memories')
            .insert([{
                couple_id: coupleId,
                title: memory.title,
                story: memory.story,
                emoji: memory.emoji || '📸',
                image_url: memory.image_url,
                location: memory.location,
                date: memory.date,
                category: memory.category || 'photos'
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get all memories for a couple
     */
    async getMemories(coupleId) {
        const { data, error } = await supabaseClient
            .from('memories')
            .select('*')
            .eq('couple_id', coupleId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    /**
     * Update a memory
     */
    async updateMemory(memoryId, updates) {
        const { data, error } = await supabaseClient
            .from('memories')
            .update(updates)
            .eq('id', memoryId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Delete a memory
     */
    async deleteMemory(memoryId) {
        const { error } = await supabaseClient
            .from('memories')
            .delete()
            .eq('id', memoryId);
        
        if (error) throw error;
    },
    
    // ----------------------------------------
    // EVENTS
    // ----------------------------------------
    
    /**
     * Add a new event
     */
    async addEvent(coupleId, event) {
        const { data, error } = await supabaseClient
            .from('events')
            .insert([{
                couple_id: coupleId,
                title: event.title,
                emoji: event.emoji || '🍽️',
                date: event.date
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get all events for a couple
     */
    async getEvents(coupleId) {
        const { data, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('couple_id', coupleId)
            .order('date', { ascending: true });
        
        if (error) throw error;
        return data || [];
    },
    
    /**
     * Update an event
     */
    async updateEvent(eventId, updates) {
        const { data, error } = await supabaseClient
            .from('events')
            .update(updates)
            .eq('id', eventId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Delete an event
     */
    async deleteEvent(eventId) {
        const { error } = await supabaseClient
            .from('events')
            .delete()
            .eq('id', eventId);
        
        if (error) throw error;
    },
    
    // ----------------------------------------
    // GOALS
    // ----------------------------------------
    
    /**
     * Add a new goal
     */
    async addGoal(coupleId, goal) {
        const { data, error } = await supabaseClient
            .from('goals')
            .insert([{
                couple_id: coupleId,
                emoji: goal.emoji,
                title: goal.title,
                type: goal.type,
                progress: goal.progress || 0,
                target: goal.target,
                deadline: goal.deadline,
                milestones: goal.milestones ? JSON.stringify(goal.milestones) : null,
                items: goal.items ? JSON.stringify(goal.items) : null
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get all goals for a couple
     */
    async getGoals(coupleId) {
        const { data, error } = await supabaseClient
            .from('goals')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Parse JSONB fields
        return (data || []).map(goal => ({
            ...goal,
            milestones: typeof goal.milestones === 'string' ? JSON.parse(goal.milestones) : goal.milestones,
            items: typeof goal.items === 'string' ? JSON.parse(goal.items) : goal.items
        }));
    },
    
    /**
     * Update a goal
     */
    async updateGoal(goalId, updates) {
        // Stringify JSON fields if present
        const dbUpdates = { ...updates };
        if (dbUpdates.milestones) dbUpdates.milestones = JSON.stringify(dbUpdates.milestones);
        if (dbUpdates.items) dbUpdates.items = JSON.stringify(dbUpdates.items);
        
        const { data, error } = await supabaseClient
            .from('goals')
            .update(dbUpdates)
            .eq('id', goalId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Delete a goal
     */
    async deleteGoal(goalId) {
        const { error } = await supabaseClient
            .from('goals')
            .delete()
            .eq('id', goalId);
        
        if (error) throw error;
    },
    
    // ----------------------------------------
    // NOTES
    // ----------------------------------------
    
    /**
     * Add a new note
     */
    async addNote(coupleId, note, createdBy) {
        const { data, error } = await supabaseClient
            .from('notes')
            .insert([{
                couple_id: coupleId,
                title: note.title,
                content: note.content,
                created_by: createdBy
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get all notes for a couple
     */
    async getNotes(coupleId) {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    /**
     * Update a note
     */
    async updateNote(noteId, updates) {
        const { data, error } = await supabaseClient
            .from('notes')
            .update(updates)
            .eq('id', noteId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Delete a note
     */
    async deleteNote(noteId) {
        const { error } = await supabaseClient
            .from('notes')
            .delete()
            .eq('id', noteId);
        
        if (error) throw error;
    },
    
    // ----------------------------------------
    // LISTS (Travel, Movies, Restaurants, etc.)
    // ----------------------------------------
    
    /**
     * Create or update a list
     */
    async upsertList(coupleId, listType, items) {
        // Check if list exists
        const existing = await this.getList(coupleId, listType);
        
        if (existing) {
            const { data, error } = await supabaseClient
                .from('lists')
                .update({ items: JSON.stringify(items) })
                .eq('id', existing.id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabaseClient
                .from('lists')
                .insert([{
                    couple_id: coupleId,
                    list_type: listType,
                    items: JSON.stringify(items)
                }])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    },
    
    /**
     * Get a list by type
     */
    async getList(coupleId, listType) {
        const { data, error } = await supabaseClient
            .from('lists')
            .select('*')
            .eq('couple_id', coupleId)
            .eq('list_type', listType)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            data.items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        }
        
        return data;
    },
    
    /**
     * Get all lists for a couple
     */
    async getAllLists(coupleId) {
        const { data, error } = await supabaseClient
            .from('lists')
            .select('*')
            .eq('couple_id', coupleId);
        
        if (error) throw error;
        
        return (data || []).map(list => ({
            ...list,
            items: typeof list.items === 'string' ? JSON.parse(list.items) : list.items
        }));
    },
    
    // ----------------------------------------
    // MOODS
    // ----------------------------------------
    
    /**
     * Record a mood entry
     */
    async recordMood(coupleId, userId, mood) {
        const { data, error } = await supabaseClient
            .from('moods')
            .insert([{
                couple_id: coupleId,
                user_id: userId,
                mood
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get latest moods for a couple
     */
    async getLatestMoods(coupleId) {
        // Get latest mood for each user in the couple
        const { data, error } = await supabaseClient
            .from('moods')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get unique latest moods per user
        const latestMoods = {};
        (data || []).forEach(mood => {
            if (!latestMoods[mood.user_id]) {
                latestMoods[mood.user_id] = mood;
            }
        });
        
        return Object.values(latestMoods);
    },
    
    /**
     * Get or create mood settings
     */
    async getMoodSettings(coupleId) {
        const { data, error } = await supabaseClient
            .from('mood_settings')
            .select('*')
            .eq('couple_id', coupleId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            data.custom_moods = typeof data.custom_moods === 'string' ? JSON.parse(data.custom_moods) : data.custom_moods;
        }
        
        return data;
    },
    
    /**
     * Update mood settings
     */
    async updateMoodSettings(coupleId, customMoods) {
        const existing = await this.getMoodSettings(coupleId);
        
        if (existing) {
            const { data, error } = await supabaseClient
                .from('mood_settings')
                .update({ custom_moods: JSON.stringify(customMoods) })
                .eq('id', existing.id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabaseClient
                .from('mood_settings')
                .insert([{
                    couple_id: coupleId,
                    custom_moods: JSON.stringify(customMoods)
                }])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    },
    
    // ----------------------------------------
    // PERIOD TRACKER
    // ----------------------------------------
    
    /**
     * Add a period entry
     */
    async addPeriodEntry(userId, coupleId, entry) {
        const { data, error } = await supabaseClient
            .from('period_entries')
            .insert([{
                user_id: userId,
                couple_id: coupleId,
                date: entry.date,
                period_length: entry.period_length,
                flow: entry.flow,
                symptoms: JSON.stringify(entry.symptoms || []),
                note: entry.note
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        if (data) {
            data.symptoms = typeof data.symptoms === 'string' ? JSON.parse(data.symptoms) : data.symptoms;
        }
        
        return data;
    },
    
    /**
     * Get period entries for a user
     */
    async getPeriodEntries(userId) {
        const { data, error } = await supabaseClient
            .from('period_entries')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map(entry => ({
            ...entry,
            symptoms: typeof entry.symptoms === 'string' ? JSON.parse(entry.symptoms) : entry.symptoms
        }));
    },
    
    /**
     * Update a period entry
     */
    async updatePeriodEntry(entryId, updates) {
        const dbUpdates = { ...updates };
        if (dbUpdates.symptoms) dbUpdates.symptoms = JSON.stringify(dbUpdates.symptoms);
        
        const { data, error } = await supabaseClient
            .from('period_entries')
            .update(dbUpdates)
            .eq('id', entryId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Delete a period entry
     */
    async deletePeriodEntry(entryId) {
        const { error } = await supabaseClient
            .from('period_entries')
            .delete()
            .eq('id', entryId);
        
        if (error) throw error;
    },
    
    // ----------------------------------------
    // QUESTIONS & ANSWERS
    // ----------------------------------------
    
    /**
     * Add a question
     */
    async addQuestion(coupleId, questionText) {
        const { data, error } = await supabaseClient
            .from('questions')
            .insert([{
                couple_id: coupleId,
                question_text: questionText
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get questions for a couple
     */
    async getQuestions(coupleId) {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*')
            .eq('couple_id', coupleId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    },
    
    /**
     * Submit an answer
     */
    async submitAnswer(questionId, userId, answer) {
        const { data, error } = await supabaseClient
            .from('answers')
            .insert([{
                question_id: questionId,
                user_id: userId,
                answer
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get answers for a couple
     */
    async getAnswers(coupleId) {
        const { data, error } = await supabaseClient
            .from('answers')
            .select('*, questions(question_text)')
            .in('question_id', 
                supabaseClient.from('questions').select('id').eq('couple_id', coupleId)
            )
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    // ----------------------------------------
    // SURPRISES
    // ----------------------------------------
    
    /**
     * Create a surprise message
     */
    async createSurprise(coupleId, surprise) {
        const { data, error } = await supabaseClient
            .from('surprises')
            .insert([{
                couple_id: coupleId,
                recipient_name: surprise.recipient_name,
                preview: surprise.preview,
                message: surprise.message,
                unlock_date: surprise.unlock_date
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Get surprises for a couple
     */
    async getSurprises(coupleId) {
        const { data, error } = await supabaseClient
            .from('surprises')
            .select('*')
            .eq('couple_id', coupleId)
            .order('unlock_date', { ascending: true });
        
        if (error) throw error;
        return data || [];
    },
    
    /**
     * Update a surprise
     */
    async updateSurprise(surpriseId, updates) {
        const { data, error } = await supabaseClient
            .from('surprises')
            .update(updates)
            .eq('id', surpriseId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // ----------------------------------------
    // FILE STORAGE
    // ----------------------------------------
    
    /**
     * Upload a file to storage
     */
    async uploadFile(file, bucket = 'memory-photos') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabaseClient.storage
            .from(bucket)
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        return publicUrl;
    },
    
    /**
     * Delete a file from storage
     */
    async deleteFile(filePath, bucket = 'memory-photos') {
        const { error } = await supabaseClient.storage
            .from(bucket)
            .remove([filePath]);
        
        if (error) throw error;
    }
};

// ============================================
// STATE MANAGER (replaces localStorage)
// ============================================

class StateManager {
    constructor() {
        this.state = null;
        this.coupleId = null;
        this.userId = null;
        this.listeners = [];
    }
    
    /**
     * Initialize state from Supabase
     */
    async init() {
        try {
            const session = await DatabaseService.getSession();
            if (!session) {
                // No user logged in, use default state
                this.state = this.getDefaultState();
                return;
            }
            
            this.userId = session.user.id;
            const couple = await DatabaseService.getCoupleByUserId(this.userId);
            
            if (couple) {
                this.coupleId = couple.id;
                this.state = await this.loadFullState();
            } else {
                this.state = this.getDefaultState();
                this.state.couple = {
                    name1: 'Gab',
                    name2: 'Avi',
                    startDate: null
                };
            }
        } catch (error) {
            console.error('Error initializing state:', error);
            this.state = this.getDefaultState();
        }
    }
    
    /**
     * Get default state structure
     */
    getDefaultState() {
        return {
            couple: { name1: 'Gab', name2: 'Avi', startDate: null },
            memories: [],
            notes: [],
            events: [],
            goals: [
                { id: '1', emoji: '✈️', title: 'Japan 2027', type: 'savings', progress: 32500, target: 50000, deadline: '2027-12-31', milestones: [{ value: 10000, label: '₱10k', reward: '🎯 Dreamer' }, { value: 20000, label: '₱20k', reward: '🎯 Planner' }, { value: 30000, label: '₱30k', reward: '🏅 Saver' }, { value: 40000, label: '₱40k', reward: '🏅 Go-Getter' }, { value: 50000, label: '₱50k', reward: '🏆 Travel Legends' }], createdAt: '2026-01-15' },
                { id: '2', emoji: '🎬', title: 'Movie Challenge', type: 'count', progress: 67, target: 100, milestones: [{ value: 25, label: '25 Movies', reward: '🏅 Cinephile I' }, { value: 50, label: '50 Movies', reward: '🏅 Cinephile II' }, { value: 75, label: '75 Movies', reward: '🏅 Movie Master' }, { value: 100, label: '100 Movies', reward: '🏆 Movie Legends' }], items: [{ id: '1', name: 'Interstellar', completed: true, date: '2026-02-14' }, { id: '2', name: 'La La Land', completed: true, date: '2026-03-01' }, { id: '3', name: 'Her', completed: true, date: '2026-03-15' }], createdAt: '2026-01-01' }
            ],
            lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] },
            trips: [],
            periodTracker: { entries: [], lastPeriodDate: null, averageLength: 36, periodLength: 6 },
            auth: { currentUser: null, token: null },
            questions: [
                'What place would you like to visit together?',
                'What\'s a favorite memory we share?',
                'What\'s something you love about me?',
                'Where do you see us in 5 years?',
                'What should we do next weekend?'
            ],
            currentQuestion: 0,
            answeredQuestions: [],
            mood: { current: {}, customMoods: ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited'], selectedPerson: 'Gab', updatedAt: new Date().toISOString() },
            surprise: {
                Gab: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' },
                Avi: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' }
            }
        };
    }
    
    /**
     * Load full state from Supabase
     */
    async loadFullState() {
        const [
            couple,
            memories,
            events,
            goals,
            notes,
            lists,
            latestMoods,
            moodSettings,
            periodEntries,
            questions,
            answers,
            surprises
        ] = await Promise.all([
            DatabaseService.getCoupleByUserId(this.userId),
            DatabaseService.getMemories(this.coupleId),
            DatabaseService.getEvents(this.coupleId),
            DatabaseService.getGoals(this.coupleId),
            DatabaseService.getNotes(this.coupleId),
            DatabaseService.getAllLists(this.coupleId),
            DatabaseService.getLatestMoods(this.coupleId),
            DatabaseService.getMoodSettings(this.coupleId),
            DatabaseService.getPeriodEntries(this.userId),
            DatabaseService.getQuestions(this.coupleId),
            DatabaseService.getAnswers(this.coupleId),
            DatabaseService.getSurprises(this.coupleId)
        ]);
        
        // Build state from database data
        const state = this.getDefaultState();
        
        if (couple) {
            state.couple = {
                name1: couple.name1,
                name2: couple.name2,
                startDate: couple.start_date
            };
        }
        
        state.memories = memories;
        state.events = events;
        state.goals = goals;
        state.notes = notes;
        
        // Build lists object
        const listsObj = { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] };
        lists.forEach(list => {
            listsObj[list.list_type] = list.items;
        });
        state.lists = listsObj;
        
        // Build mood state
        const moodCurrent = {};
        if (couple) {
            latestMoods.forEach(mood => {
                if (mood.user_id === couple.user1_id) {
                    moodCurrent[couple.name1] = mood.mood;
                } else if (mood.user_id === couple.user2_id) {
                    moodCurrent[couple.name2] = mood.mood;
                }
            });
        }
        state.mood.current = moodCurrent;
        if (moodSettings) {
            state.mood.customMoods = moodSettings.custom_moods;
        }
        
        // Build period tracker
        state.periodTracker.entries = periodEntries;
        if (periodEntries.length > 0) {
            state.periodTracker.lastPeriodDate = periodEntries[0].date;
            state.periodTracker.periodLength = periodEntries[0].period_length;
        }
        
        // Build questions and answers
        state.questions = questions.map(q => q.question_text);
        state.answeredQuestions = answers.map(a => ({
            question: a.questions?.question_text,
            answer: a.answer,
            date: new Date(a.created_at).toISOString().split('T')[0],
            by: a.user_id
        }));
        
        // Build surprises
        surprises.forEach(s => {
            state.surprise[s.recipient_name] = {
                preview: s.preview,
                message: s.message,
                unlockDate: s.unlock_date
            };
        });
        
        return state;
    }
    
    /**
     * Save state to Supabase
     */
    async save() {
        if (!this.coupleId || !this.userId) return;
        
        try {
            // Update couple
            await DatabaseService.updateCouple(this.coupleId, {
                name1: this.state.couple.name1,
                name2: this.state.couple.name2,
                start_date: this.state.couple.startDate
            });
            
            // Sync lists
            for (const [listType, items] of Object.entries(this.state.lists)) {
                await DatabaseService.upsertList(this.coupleId, listType, items);
            }
            
            // Update mood settings
            await DatabaseService.updateMoodSettings(this.coupleId, this.state.mood.customMoods);
            
            // Notify listeners
            this.notifyListeners();
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.state));
    }
}

// Create global state manager instance
const stateManager = new StateManager();

// ============================================
// EXPORT FOR USE IN OTHER FILES
// ============================================

// Make available globally
window.DatabaseService = DatabaseService;
window.stateManager = stateManager;
window.supabase = supabaseClient;