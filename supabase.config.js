/**
 * Supabase Configuration
 * 
 * Update these values with your Supabase project credentials.
 * Get these from: Supabase Dashboard > Settings > API
 */

const SUPABASE_CONFIG = {
    // Your Supabase project URL
    url: 'https://tdlsgxoiaxauswarjzjg.supabase.co',
    
    // Your Supabase anon/public key
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbHNneG9pYXhhdXN3YXJqempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDczNzYsImV4cCI6MjA5NTk4MzM3Nn0.FsrzIeojP3P1SwUuIglm9dmt8hJI8OF_MS8m9nv5v2E',

    // Pre-defined accounts for Gab and Avi
    // These auto-login when the Gab/Avi buttons are clicked
    accounts: {
        gab: {
            email: 'gab@example.com',
            password: 'gab-gavvy-2025'
        },
        avi: {
            email: 'avi@example.com',
            password: 'avi-gavvy-2025'
        }
    }
};

// Make configuration available globally
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Export for module-based usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}