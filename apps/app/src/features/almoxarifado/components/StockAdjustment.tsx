'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Plus, Check, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { adjustInventoryStockAction } from '@/app/actions/inventoryActions';
import { useToast } from '@/components/ui/toaster';
import {
	stockAdjustmentSchema,
	StockAdjustmentFormData,
} from '../schemas/stockAdjustmentSchema';

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
	const { addToast } = useToast();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { isSubmitting },
	} = useForm<StockAdjustmentFormData>({
		resolver: zodResolver(stockAdjustmentSchema),
		defaultValues: { quantity: initialQuantity },
	});

	const quantity = watch('quantity');

	useEffect(() => {
		reset({ quantity: initialQuantity });
	}, [initialQuantity, reset]);

	const onSubmit = async (data: StockAdjustmentFormData) => {
		if (data.quantity === initialQuantity) {
			setIsEditing(false);
			return;
		}

		try {
			const result = await adjustInventoryStockAction({
				inventoryId,
				siteId,
				newQuantity: data.quantity,
				currentQuantity: initialQuantity,
			});

			if (result.success) {
				addToast('Estoque ajustado com sucesso', 'success');
				setIsEditing(false);
				onSaved();
			} else {
				throw new Error(result.error);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: 'Erro ao ajustar estoque';
			addToast(message, 'error');
		}
	};

	const handleCancel = (e: React.MouseEvent) => {
		e.stopPropagation();
		reset({ quantity: initialQuantity });
		setIsEditing(false);
	};

	const increment = (e: React.MouseEvent) => {
		e.stopPropagation();
		setValue('quantity', quantity + 1, { shouldValidate: true });
	};

	const decrement = (e: React.MouseEvent) => {
		e.stopPropagation();
		setValue('quantity', Math.max(0, quantity - 1), {
			shouldValidate: true,
		});
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
				<span>
					{initialQuantity} {unit}
				</span>
				<Plus
					size={14}
					className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
				/>
			</div>
		);
	}

	return (
		<form
			className="flex items-center justify-end gap-2"
			onClick={(e) => e.stopPropagation()}
			onSubmit={handleSubmit(onSubmit)}
		>
			<div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
				<button
					type="button"
					disabled={isSubmitting}
					onClick={decrement}
					className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50 text-gray-500"
				>
					<Minus size={14} />
				</button>
				<input
					type="number"
					{...register('quantity', { valueAsNumber: true })}
					className="w-10 text-center bg-transparent border-none focus:ring-0 text-sm font-bold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					disabled={isSubmitting}
					autoFocus
				/>
				<button
					type="button"
					disabled={isSubmitting}
					onClick={increment}
					className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50 text-gray-500"
				>
					<Plus size={14} />
				</button>
			</div>
			<div className="flex gap-0.5">
				<Button
					type="submit"
					size="sm"
					variant="ghost"
					disabled={isSubmitting}
					className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
				>
					{isSubmitting ? (
						<Loader2 size={14} className="animate-spin" />
					) : (
						<Check size={16} strokeWidth={3} />
					)}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={handleCancel}
					disabled={isSubmitting}
					className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
				>
					<X size={16} strokeWidth={3} />
				</Button>
			</div>
		</form>
	);
}
