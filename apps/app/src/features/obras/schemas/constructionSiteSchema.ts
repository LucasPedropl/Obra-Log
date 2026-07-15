import { z } from 'zod';

function timeToMinutes(value: string): number {
	const [h, m] = value.split(':').map(Number);
	return h * 60 + (m || 0);
}

const dayScheduleSchema = z.object({
	start: z.string().nullable().optional().or(z.literal('')),
	end: z.string().nullable().optional().or(z.literal('')),
	lunch_start: z.string().nullable().optional().or(z.literal('')),
	lunch_end: z.string().nullable().optional().or(z.literal('')),
	active: z.boolean(),
});

export const constructionSiteSchema = z.object({
	name: z.string().min(1, 'O nome da obra é obrigatório'),
	tolerance_minutes: z.coerce
		.number({ message: 'Informe a tolerância' })
		.min(0, 'Não pode ser negativo')
		.max(240, 'Máximo de 240 min'),
	workday_schedule_json: z.object({
		monday: dayScheduleSchema,
		tuesday: dayScheduleSchema,
		wednesday: dayScheduleSchema,
		thursday: dayScheduleSchema,
		friday: dayScheduleSchema,
		saturday: dayScheduleSchema,
		sunday: dayScheduleSchema,
	}).optional(),
}).superRefine((data, ctx) => {
	const schedule = data.workday_schedule_json;
	if (!schedule) return;

	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
	for (const day of days) {
		const dayData = schedule[day];
		if (!dayData) continue;
		if (dayData.active && dayData.start && dayData.end) {
			const startMin = timeToMinutes(dayData.start);
			const endMin = timeToMinutes(dayData.end);

			if (startMin >= endMin) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Horário de fim deve ser posterior ao início',
					path: ['workday_schedule_json', day, 'end'],
				});
			}

			if (dayData.lunch_start && dayData.lunch_end) {
				const lunchStartMin = timeToMinutes(dayData.lunch_start);
				const lunchEndMin = timeToMinutes(dayData.lunch_end);

				if (lunchStartMin >= lunchEndMin) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Volta do almoço deve ser posterior à saída',
						path: ['workday_schedule_json', day, 'lunch_end'],
					});
				}

				if (lunchStartMin <= startMin || lunchStartMin >= endMin) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Almoço fora da jornada',
						path: ['workday_schedule_json', day, 'lunch_start'],
					});
				}

				if (lunchEndMin <= startMin || lunchEndMin >= endMin) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Almoço fora da jornada',
						path: ['workday_schedule_json', day, 'lunch_end'],
					});
				}
			}
		}
	}
});

export type ConstructionSiteFormData = z.infer<typeof constructionSiteSchema>;

export const siteConfigSchema = z.object({
	tolerance_minutes: z.coerce
		.number({ message: 'Informe a tolerância' })
		.min(0, 'Não pode ser negativo')
		.max(240, 'Máximo de 240 min'),
	workday_schedule_json: z.object({
		monday: dayScheduleSchema,
		tuesday: dayScheduleSchema,
		wednesday: dayScheduleSchema,
		thursday: dayScheduleSchema,
		friday: dayScheduleSchema,
		saturday: dayScheduleSchema,
		sunday: dayScheduleSchema,
	}).optional(),
}).superRefine((data, ctx) => {
	const schedule = data.workday_schedule_json;
	if (!schedule) return;

	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
	for (const day of days) {
		const dayData = schedule[day];
		if (!dayData) continue;
		if (dayData.active && dayData.start && dayData.end) {
			const startMin = timeToMinutes(dayData.start);
			const endMin = timeToMinutes(dayData.end);

			if (startMin >= endMin) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Horário de fim deve ser posterior ao início',
					path: ['workday_schedule_json', day, 'end'],
				});
			}

			if (dayData.lunch_start && dayData.lunch_end) {
				const lunchStartMin = timeToMinutes(dayData.lunch_start);
				const lunchEndMin = timeToMinutes(dayData.lunch_end);

				if (lunchStartMin >= lunchEndMin) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Volta do almoço deve ser posterior à saída',
						path: ['workday_schedule_json', day, 'lunch_end'],
					});
				}

				if (lunchStartMin <= startMin || lunchStartMin >= endMin) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Almoço fora da jornada',
						path: ['workday_schedule_json', day, 'lunch_start'],
					});
				}

				if (lunchEndMin <= startMin || lunchEndMin >= endMin) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Almoço fora da jornada',
						path: ['workday_schedule_json', day, 'lunch_end'],
					});
				}
			}
		}
	}
});

export type SiteConfigFormData = z.infer<typeof siteConfigSchema>;
