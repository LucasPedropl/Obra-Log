'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/config/supabase';

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const supabase = createClient();

	const refreshSession = async () => {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			setUser(session?.user ?? null);
		} catch (error) {
			console.error('Error refreshing session:', error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// Inicializa a sessão
		refreshSession();

		// Escuta mudanças no estado de autenticação
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				setUser(session?.user ?? null);
				
				if (event === 'SIGNED_OUT') {
					router.push('/login');
					router.refresh();
				} else if (event === 'SIGNED_IN') {
					router.refresh();
				}
			}
		);

		return () => {
			subscription.unsubscribe();
		};
	}, [supabase, router]);

	const signOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
		router.push('/login');
		router.refresh();
	};

	return (
		<AuthContext.Provider value={{ user, loading, signOut, refreshSession }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
