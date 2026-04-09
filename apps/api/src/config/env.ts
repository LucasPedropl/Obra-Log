import dotenv from 'dotenv';
dotenv.config();

export const env = {
	PORT: process.env.PORT || 5005,
	SUPABASE_URL: process.env.SUPABASE_URL || '',
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
