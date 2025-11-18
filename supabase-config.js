/**
 * Supabase Configuration and Authentication Module
 * Handles user authentication and database connections
 */

// Supabase Configuration
const SUPABASE_URL = 'https://zaomjxiyzeimtdullgvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphb21qeGl5emVpbXRkdWxsZ3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjEzODAsImV4cCI6MjA3ODk5NzM4MH0.0fSG5AkoCsNnenfwN2KBpdCSWFm7H1a9KQFN8t7Y7os';

// Initialize Supabase client
let supabaseClient = null;

// Initialize Supabase (call this after loading the library)
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Please include the CDN script.');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    return supabaseClient;
}

// Get Supabase client
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * Authentication Manager Class
 */
class AuthManager {
    constructor() {
        this.supabase = getSupabaseClient();
        this.currentUser = null;
        this.onAuthChangeCallbacks = [];
    }

    /**
     * Sign up new user
     */
    async signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) throw error;

            // Create user profile in database
            if (data.user) {
                await this.createUserProfile(data.user);
            }

            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in existing user
     */
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.notifyAuthChange(data.user);

            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.notifyAuthChange(null);

            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current session
     */
    async getSession() {
        try {
            const { data, error } = await this.supabase.auth.getSession();
            if (error) throw error;

            if (data.session) {
                this.currentUser = data.session.user;
            }

            return { success: true, session: data.session, user: data.session?.user };
        } catch (error) {
            console.error('Get session error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const sessionResult = await this.getSession();
        if (sessionResult.success && sessionResult.user) {
            this.currentUser = sessionResult.user;
            return this.currentUser;
        }

        return null;
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return !!user;
    }

    /**
     * Create user profile in database
     */
    async createUserProfile(user) {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert([{
                    user_id: user.id,
                    email: user.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();

            if (error && error.code !== '23505') { // Ignore duplicate key errors
                throw error;
            }

            return { success: true, profile: data };
        } catch (error) {
            console.error('Create profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('No authenticated user');

            const { data, error } = await this.supabase
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .select();

            if (error) throw error;

            return { success: true, profile: data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('No authenticated user');

            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            return { success: true, profile: data };
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Listen for auth state changes
     */
    onAuthChange(callback) {
        this.onAuthChangeCallbacks.push(callback);

        // Set up Supabase auth listener
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            this.notifyAuthChange(this.currentUser);
        });
    }

    /**
     * Notify all callbacks of auth change
     */
    notifyAuthChange(user) {
        this.onAuthChangeCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth change callback error:', error);
            }
        });
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            return { success: true, message: 'Password reset email sent' };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return { success: true, message: 'Password updated successfully' };
        } catch (error) {
            console.error('Update password error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global auth manager instance
let authManager = null;

function getAuthManager() {
    if (!authManager) {
        authManager = new AuthManager();
    }
    return authManager;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, getAuthManager, initSupabase, getSupabaseClient };
}
