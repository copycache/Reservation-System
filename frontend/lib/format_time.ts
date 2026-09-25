export function formatTime(time: string | Date, suffix = true) {
	const isDate = time instanceof Date;
	const [hours, minutes] = isDate
		? [time.getHours(), time.getMinutes()]
		: time.split(":").map(Number);
	const newSuffix = hours >= 12 ? "PM" : "AM";
	const hour = hours % 12 || 12;

	return `${hour}${isDate || minutes ? `:${String(minutes).padStart(2, "0")}` : ""}${isDate ? " " : ""}${suffix ? `${isDate ? " " : ""}${newSuffix}` : ""}`;
}
