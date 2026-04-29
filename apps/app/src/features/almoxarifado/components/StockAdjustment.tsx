'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/config/supabase';
import { adjustInventoryStockAction } from '@/app/actions/inventoryActions';
import { useToast } from '@/components/ui/toaster';

interface StockAdjustmentProps {
	inventoryId: string;
	siteId: string;
	initialQuantity: number;
	unit: string;
	onSaved: () => void;
}

export function StockAdjustment({
	inventoryId,
	siteId,
	initialQuantity,
	unit,
	onSaved,
}: StockAdjustmentProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [quantity, setQuantity] = useState(initialQuantity);
	const [isLoading, setIsLoading] = useState(false);
	const { addToast } = useToast();
	const supabase = createClient();

	// Sincroniza se a quantidade inicial mudar externamente
	useEffect(() => {
		setQuantity(initialQuantity);
	}, [initialQuantity]);

	const handleSave = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (quantity === initialQuantity) {
			setIsEditing(false);
			return;
		}

		setIsLoading(true);
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error('Usuário não autenticado');

			const result = await adjustInventoryStockAction({
				inventoryId,
				siteId,
				newQuantity: quantity,
				currentQuantity: initialQuantity,
				userId: user.id,
			});

			if (result.success) {
				addToast('Estoque ajustado com sucesso', 'success');
				setIsEditing(false);
				onSaved();
			} else {
				throw new Error(result.error);
			}
		} catch (error: any) {
			addToast(error.message || 'Erro ao ajustar estoque', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = (e: React.MouseEvent) => {
		e.stopPropagation();
		setQuantity(initialQuantity);
		setIsEditing(false);
	};

	const increment = (e: React.MouseEvent) => {
		e.stopPropagation();
		setQuantity(prev => prev + 1);
	};

	const decrement = (e: React.MouseEvent) => {
		e.stopPropagation();
		setQuantity(prev => Math.max(0, prev - 1));
	};

	if (!isEditing) {
		return (
			<div 
				onClick={(e) => {
					e.stopPropagation();
					setIsEditing(true);
				}}
				className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors font-semibold flex items-center justify-end gap-2 group min-w-[80px]"
				title="Clique para ajustar rápido"
			>
				<span>{initialQuantity} {unit}</span>
				<Plus size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>
		);
	}

	return (
		<div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
			<div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
				<button
					disabled={isLoading}
					onClick={decrement}
					className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50 text-gray-500"
				>
					<Minus size={14} />
				</button>
				<input
					type="number"
					value={quantity}
					onChange={(e) => setQuantity(Number(e.target.value))}
					className="w-10 text-center bg-transparent border-none focus:ring-0 text-sm font-bold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					disabled={isLoading}
					autoFocus
				/>
				<button
					disabled={isLoading}
					onClick={increment}
					className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50 text-gray-500"
				>
					<Plus size={14} />
				</button>
			</div>
			<div className="flex gap-0.5">
				<Button
					size="sm"
					variant="ghost"
					onClick={handleSave}
					disabled={isLoading}
					className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
				>
					{isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleCancel}
					disabled={isLoading}
					className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
				>
					<X size={16} strokeWidth={3} />
				</Button>
			</div>
		</div>
	);
}
