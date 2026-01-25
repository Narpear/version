import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { User } from '@/types';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(email: string, password: string, name: string, heightCm: number, age: number): Promise<User | null> {
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      name,
      height_cm: heightCm,
      age,
      gender: 'female'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) return null;

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  return user;
}