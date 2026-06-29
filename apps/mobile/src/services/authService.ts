// ═══════════════════════════════════════════════════════════════════════════
// Authentication Service — Real Supabase Auth
// Replaces the mock user system entirely.
// ═══════════════════════════════════════════════════════════════════════════

import 'react-native-url-polyfill/auto';
import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import type { User } from '../store/appStore';

// ── Sign Up ──────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  name: string,
  phone?: string,
): Promise<{ user: User | null; error: string | null }> {
  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name, phone },
      },
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Registration failed — please try again.' };
    }

    // 2. Create profile row in profiles table
    const profileId = authData.user.id;
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: profileId,
      auth_id: profileId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone ?? null,
      role: 'user',
      points: 0,
      total_earned: 0,
      level: 1,
      verified: false,
      review_count: 0,
      photo_count: 0,
      city: 'Addis Ababa',
    });

    if (profileError) {
      console.warn('[authService] Profile creation error:', profileError.message);
      // Auth succeeded — still return partial user
    }

    return {
      user: {
        id: profileId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone,
        role: 'user',
        points: 0,
        totalEarned: 0,
        level: 1,
        verified: false,
        createdAt: new Date().toISOString(),
        reviewCount: 0,
        photoCount: 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('[authService] signUp exception:', err);
    return { user: null, error: err?.message ?? 'Unknown error during sign up.' };
  }
}

// ── Sign In with Google (OAuth) ───────────────────────────────────────────
export async function signInWithGoogle(): Promise<{ user: User | null; error: string | null }> {
  try {
    const redirectTo = makeRedirectUri({
      scheme: 'nexilocate',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Required for React Native
      },
    });

    if (error || !data.url) {
      return { user: null, error: error?.message ?? 'Could not start Google sign-in.' };
    }

    console.log('[Google OAuth] Opening URL:', data.url);
    console.log('[Google OAuth] Redirect to:', redirectTo);

    // Open Google sign-in in a browser session
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { user: null, error: 'cancelled' };
    }

    if (result.type !== 'success') {
      return { user: null, error: 'Google sign-in failed. Please try again.' };
    }

    // Parse access_token + refresh_token from redirect URL hash
    const hash = new URL(result.url).hash.substring(1);
    const params: Record<string, string> = {};
    hash.split('&').forEach((part) => {
      const [k, v] = part.split('=');
      if (k) params[k] = decodeURIComponent(v ?? '');
    });

    const access_token = params['access_token'];
    const refresh_token = params['refresh_token'];

    if (!access_token || !refresh_token) {
      return { user: null, error: 'Authentication tokens missing. Please try again.' };
    }

    // Set session in Supabase client
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError || !sessionData.user) {
      return { user: null, error: sessionError?.message ?? 'Failed to establish session.' };
    }

    // Fetch or auto-create profile for this Google user
    let profile = await fetchProfile(sessionData.user.id);

    if (!profile) {
      const meta = sessionData.user.user_metadata ?? {};
      const googleName = meta.full_name ?? meta.name ?? sessionData.user.email?.split('@')[0] ?? 'User';
      const googleAvatar = meta.avatar_url ?? meta.picture ?? null;

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: sessionData.user.id,
        auth_id: sessionData.user.id,
        email: sessionData.user.email ?? '',
        name: googleName,
        avatar: googleAvatar,
        role: 'user',
        points: 0,
        total_earned: 0,
        level: 1,
        verified: false,
        review_count: 0,
        photo_count: 0,
        city: 'Addis Ababa',
      });

      if (upsertError) {
        console.error('[authService] Google profile upsert error:', upsertError.message);
      }

      profile = await fetchProfile(sessionData.user.id);
    }

    if (!profile) {
      return { user: null, error: 'Profile could not be loaded. Please try again.' };
    }

    return { user: profile, error: null };
  } catch (err: any) {
    console.error('[authService] signInWithGoogle exception:', err);
    return { user: null, error: err?.message ?? 'Google sign-in failed.' };
  }
}

// ── Sign In ───────────────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { user: null, error: 'Incorrect email or password.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { user: null, error: 'Please verify your email before signing in.' };
      }
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Sign in failed. Please try again.' };
    }

    // Fetch full profile
    const profile = await fetchProfile(data.user.id);
    return { user: profile, error: null };
  } catch (err: any) {
    console.error('[authService] signIn exception:', err);
    return { user: null, error: err?.message ?? 'Unknown error during sign in.' };
  }
}

// ── Sign Out ──────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Silently handle — auth state is already invalid
  }
}

// ── Get Current Session ───────────────────────────────────────────────────
export async function getCurrentSession(): Promise<{
  userId: string | null;
  user: User | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { userId: null, user: null };

    const profile = await fetchProfile(session.user.id);
    return { userId: session.user.id, user: profile };
  } catch {
    return { userId: null, user: null };
  }
}

// ── Fetch Profile from DB ─────────────────────────────────────────────────
export async function fetchProfile(authId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authId)
      .maybeSingle();

    if (error) {
      console.warn('[authService] fetchProfile error:', error.message);
      return null;
    }
    if (!data) {
      return null;
    }

    return rowToUser(data);
  } catch {
    return null;
  }
}

// ── Update Profile ────────────────────────────────────────────────────────
export async function updateProfile(
  userId: string,
  updates: Partial<{
    name: string;
    phone: string;
    avatar: string;
    bio: string;
    city: string;
  }>,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Update failed.' };
  }
}

// ── Reset Password ────────────────────────────────────────────────────────
export async function sendPasswordReset(
  email: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'nexilocate://reset-password' },
    );
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Failed to send reset email.' };
  }
}

// ── Get current user ID (convenience) ────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ── Upload Avatar to Supabase Storage ─────────────────────────────────────
export async function uploadAvatar(
  userId: string,
  imageUri: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Determine file extension from URI
    const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `avatar-${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    // Update profile with new avatar URL
    const { error: updateError } = await updateProfile(userId, { avatar: avatarUrl });

    if (updateError) {
      return { url: null, error: updateError };
    }

    return { url: avatarUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message ?? 'Failed to upload avatar.' };
  }
}

// ── Row → User mapper ─────────────────────────────────────────────────────
function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name ?? 'User',
    email: row.email ?? '',
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
    role: row.role ?? 'user',
    points: row.points ?? 0,
    totalEarned: row.total_earned ?? 0,
    level: row.level ?? 1,
    verified: row.verified ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    reviewCount: row.review_count ?? 0,
    photoCount: row.photo_count ?? 0,
  };
}
