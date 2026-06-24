export interface SupplyItemOption {
	id: string;
	name: string;
	code: string;
	unit: string;
	category: string;
	subcategory: string;
}

export interface RawSupplyItem {
	id: string;
	name: string;
	code: string | null;
	measurement_units: {
		abbreviation: string;
	} | null;
	categories: {
		primary_category: string;
		secondary_category: string | null;
	} | null;
}

export interface AddInventoryPayloadItem {
	catalogId: string;
	quantity: number;
	category: 'NONE' | 'TOOL' | 'EPI';
}
