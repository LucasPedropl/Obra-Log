import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
	children: React.ReactNode;
	resourceName?: string;
	requiredAction?: 'view' | 'create' | 'edit' | 'delete';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	resourceName,
	requiredAction = 'view',
}) => {
	const { user, permissions, isLoading, isAllowed } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/app/login" state={{ from: location }} replace />;
	}

	// We only check if both resourceName and action are provided
	if (resourceName && requiredAction) {
		// If there is no permissions loaded yet, or if they check false
		// Redirect them to dashboard
		if (!permissions || !isAllowed(resourceName, requiredAction)) {
			return <Navigate to="/app/dashboard" replace />;
		}
	}

	return <>{children}</>;
};
