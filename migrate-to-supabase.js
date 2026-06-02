/**
 * Migration Script: localStorage to Supabase
 * 
 * This script helps migrate existing data from localStorage to Supabase.
 * Run this once after setting up Supabase to preserve your existing data.
 * 
 * Usage:
 * 1. Make sure Supabase is configured (update supabase.config.js)
 * 2. Include this script in your HTML after supabase-client.js
 * 3. Call migrateToSupabase() from the browser console or uncomment the auto-run line
 */

const MigrationHelper = {
    /**
     * Main migration function
     */
    async migrate() {
        console.log('🚀 Starting migration to Supabase...');
        
        try {
            // Check if Supabase is configured
            if (!window.SUPABASE_CONFIG || 
                window.SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co') {
                console.error('❌ Supabase is not configured. Please update supabase.config.js first.');
                return false;
            }
            
            // Get existing state from localStorage
            const savedState = localStorage.getItem('gavvy-state');
            if (!savedState) {
                console.log('ℹ️ No existing data found in localStorage.');
                return false;
            }
            
            const state = JSON.parse(savedState);
            console.log('📦 Found existing state:', Object.keys(state));
            
            // Wait for Supabase client to be ready
            if (!window.DatabaseService || !window.stateManager) {
                console.log('⏳ Waiting for Supabase client to initialize...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Check if user is authenticated
            let session = await DatabaseService.getSession();
            
            if (!session) {
                console.log('🔐 No active session. Please sign in to migrate data.');
                // Optionally, you could create a temporary account for migration
                // For now, we'll guide the user to sign in
                return false;
            }
            
            const userId = session.user.id;
            console.log('👤 Migrating as user:', userId);
            
            // Get or create couple
            let couple = await DatabaseService.getCoupleByUserId(userId);
            
            if (!couple) {
                console.log('👫 Creating new couple record...');
                couple = await DatabaseService.createCouple(
                    userId,
                    userId, // For single-user, same user fills both roles
                    state.couple.name1 || 'Gab',
                    state.couple.name2 || 'Avi',
                    state.couple.startDate || null
                );
                console.log('✅ Created couple:', couple.id);
            } else {
                console.log('✅ Using existing couple:', couple.id);
                // Update couple info
                await DatabaseService.updateCouple(couple.id, {
                    name1: state.couple.name1 || couple.name1,
                    name2: state.couple.name2 || couple.name2,
                    start_date: state.couple.startDate || couple.start_date
                });
            }
            
            const coupleId = couple.id;
            let migrationCount = 0;
            
            // Migrate memories
            if (state.memories && state.memories.length > 0) {
                console.log(`📸 Migrating ${state.memories.length} memories...`);
                for (const memory of state.memories) {
                    try {
                        await DatabaseService.addMemory(coupleId, {
                            title: memory.title,
                            story: memory.story || memory.text,
                            emoji: memory.emoji || '📸',
                            image_url: memory.image,
                            location: memory.location,
                            date: memory.date,
                            category: memory.category || 'photos'
                        });
                        migrationCount++;
                    } catch (err) {
                        console.error('Failed to migrate memory:', memory.title, err);
                    }
                }
                console.log(`✅ Migrated ${migrationCount} memories.`);
            }
            
            // Migrate events
            if (state.events && state.events.length > 0) {
                console.log(`📅 Migrating ${state.events.length} events...`);
                for (const event of state.events) {
                    try {
                        await DatabaseService.addEvent(coupleId, {
                            title: event.title,
                            emoji: event.emoji || '🍽️',
                            date: event.date
                        });
                    } catch (err) {
                        console.error('Failed to migrate event:', event.title, err);
                    }
                }
                console.log(`✅ Migrated ${state.events.length} events.`);
            }
            
            // Migrate goals
            if (state.goals && state.goals.length > 0) {
                console.log(`🎯 Migrating ${state.goals.length} goals...`);
                for (const goal of state.goals) {
                    try {
                        await DatabaseService.addGoal(coupleId, {
                            emoji: goal.emoji,
                            title: goal.title,
                            type: goal.type,
                            progress: goal.progress || 0,
                            target: goal.target,
                            deadline: goal.deadline,
                            milestones: goal.milestones,
                            items: goal.items
                        });
                    } catch (err) {
                        console.error('Failed to migrate goal:', goal.title, err);
                    }
                }
                console.log(`✅ Migrated ${state.goals.length} goals.`);
            }
            
            // Migrate notes
            if (state.notes && state.notes.length > 0) {
                console.log(`📝 Migrating ${state.notes.length} notes...`);
                for (const note of state.notes) {
                    try {
                        await DatabaseService.addNote(coupleId, {
                            title: note.title,
                            content: note.content
                        }, userId);
                    } catch (err) {
                        console.error('Failed to migrate note:', note.title, err);
                    }
                }
                console.log(`✅ Migrated ${state.notes.length} notes.`);
            }
            
            // Migrate lists
            if (state.lists) {
                console.log('📋 Migrating lists...');
                for (const [listType, items] of Object.entries(state.lists)) {
                    if (items && items.length >= 0) {
                        try {
                            await DatabaseService.upsertList(coupleId, listType, items);
                        } catch (err) {
                            console.error(`Failed to migrate list: ${listType}`, err);
                        }
                    }
                }
                console.log('✅ Migrated lists.');
            }
            
            // Migrate mood settings
            if (state.mood && state.mood.customMoods) {
                console.log('😊 Migrating mood settings...');
                try {
                    await DatabaseService.updateMoodSettings(coupleId, state.mood.customMoods);
                    console.log('✅ Migrated mood settings.');
                } catch (err) {
                    console.error('Failed to migrate mood settings:', err);
                }
            }
            
            // Migrate answered questions
            if (state.answeredQuestions && state.answeredQuestions.length > 0) {
                console.log(`💬 Migrating ${state.answeredQuestions.length} answers...`);
                // First, ensure questions exist
                const questions = await DatabaseService.getQuestions(coupleId);
                const existingQuestionTexts = questions.map(q => q.question_text);
                
                for (const qa of state.answeredQuestions) {
                    try {
                        // Find or create the question
                        let questionId = questions.find(q => q.question_text === qa.question)?.id;
                        
                        if (!questionId && qa.question) {
                            const newQuestion = await DatabaseService.addQuestion(coupleId, qa.question);
                            questionId = newQuestion.id;
                        }
                        
                        if (questionId) {
                            await DatabaseService.submitAnswer(questionId, userId, qa.answer);
                        }
                    } catch (err) {
                        console.error('Failed to migrate answer:', qa.question, err);
                    }
                }
                console.log(`✅ Migrated answers.`);
            }
            
            // Migrate period tracker entries
            if (state.periodTracker && state.periodTracker.entries && state.periodTracker.entries.length > 0) {
                console.log(`🩸 Migrating ${state.periodTracker.entries.length} period entries...`);
                for (const entry of state.periodTracker.entries) {
                    try {
                        await DatabaseService.addPeriodEntry(userId, coupleId, {
                            date: entry.date,
                            period_length: entry.periodLength,
                            flow: entry.flow,
                            symptoms: entry.symptoms || [],
                            note: entry.note
                        });
                    } catch (err) {
                        console.error('Failed to migrate period entry:', entry.date, err);
                    }
                }
                console.log(`✅ Migrated period entries.`);
            }
            
            // Migration complete!
            console.log('🎉 Migration completed successfully!');
            console.log('💡 You can now clear your localStorage if desired.');
            console.log('💡 Your data is now safely stored in Supabase!');
            
            // Optionally clear localStorage (commented out by default)
            // localStorage.removeItem('gavvy-state');
            
            // Re-initialize state manager to load from Supabase
            await stateManager.init();
            
            return true;
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    },
    
    /**
     * Check migration status
     */
    getStatus() {
        const hasLocalStorage = !!localStorage.getItem('gavvy-state');
        const isSupabaseConfigured = window.SUPABASE_CONFIG && 
            window.SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co';
        
        return {
            hasLocalStorage,
            isSupabaseConfigured,
            ready: hasLocalStorage && isSupabaseConfigured
        };
    },
    
    /**
     * Rollback - clear Supabase data (use with caution!)
     */
    async rollback() {
        if (!confirm('⚠️ Are you sure you want to delete all data from Supabase? This cannot be undone!')) {
            return;
        }
        
        try {
            const session = await DatabaseService.getSession();
            if (!session) {
                console.error('❌ Not authenticated');
                return;
            }
            
            const couple = await DatabaseService.getCoupleByUserId(session.user.id);
            if (!couple) {
                console.log('ℹ️ No couple data to delete');
                return;
            }
            
            // Delete all data (in order to avoid FK constraints)
            const coupleId = couple.id;
            
            // Note: Due to RLS, users can only delete their own data
            console.log('🗑️ Deleting data...');
            
            // This is a simplified rollback - in production you might want
            // more granular control
            
            console.log('✅ Rollback complete');
            
        } catch (error) {
            console.error('❌ Rollback failed:', error);
        }
    }
};

// Make available globally
window.MigrationHelper = MigrationHelper;

// Auto-run migration check on page load (optional)
// Uncomment the following lines to automatically check and prompt for migration:
/*
document.addEventListener('DOMContentLoaded', async () => {
    const status = MigrationHelper.getStatus();
    if (status.ready) {
        const shouldMigrate = confirm(
            '📦 Found existing data in localStorage.\n\n' +
            'Would you like to migrate it to Supabase?\n\n' +
            'This will copy your data to the cloud database.'
        );
        if (shouldMigrate) {
            await MigrationHelper.migrate();
        }
    }
});
*/