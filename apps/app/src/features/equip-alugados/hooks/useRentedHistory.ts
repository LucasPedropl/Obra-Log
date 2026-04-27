import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/config/supabase';

export function useRentedHistory(siteId: string) {
	const supabase = createClient();
	const [history, setHistory] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const fetchHistory = useCallback(async () => {
		setIsLoading(true);
		try {
			// Instead of jumping scopes, we can just grab from rented_equipments everything,
			// both ACTIVE and RETURNED. "RETURNED" are basically the history of what left.
			const { data, error } = await supabase
				.from('rented_equipments')
				.select('*')
				.eq('site_id', siteId)
				.order('entry_date', { ascending: false });

			if (error) {
				console.error(
					'Error fetching rented equipments history:',
					error,
				);
				return;
			}

			// We will format the output.
			// It has entry_date and exit_date
			const formattedHistory = (data || []).map((item: any) => ({
				id: item.id,
				name: item.name,
				category: item.category,
				quantity: item.quantity,
				status: item.status,
				entryDate: item.entry_date,
				exitDate: item.exit_date,
				description: item.description,
			}));

			setHistory(formattedHistory);
		} catch (err) {
			console.error('Unexpected error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [siteId]);

	useEffect(() => {
		if (siteId) {
			fetchHistory();
		}
	}, [siteId, fetchHistory]);

	const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));

	return {
		history,
		isLoading,
		searchTerm,
		setSearchTerm,
		currentPage,
		setCurrentPage,
		itemsPerPage,
		totalPages,
	};
}
