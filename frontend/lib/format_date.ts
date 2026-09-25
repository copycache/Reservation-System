export function formatDateInput(date: Date | undefined) {
	if (!date) {
		return "";
	}

	return date.toLocaleDateString("en-US", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export function formatDate(date: string, weekday = true) {
	return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
		weekday: weekday ? "short" : undefined,
		month: "short",
		day: "numeric",
	});
}

export function formatWeekday(date: Date) {
	return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatMonthDay(date: Date) {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}
