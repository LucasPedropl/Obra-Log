import React from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';

export default function Ferramentas() {
	const { id } = useParams();

	return (
		<ERPLayout>
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-text-main">
					Ferramentas
				</h1>
				<p className="text-text-muted">
					Controle de ferramentas da obra {id}.
				</p>
			</div>
		</ERPLayout>
	);
}
