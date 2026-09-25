export function PascalCase(value: String) {
	return (value
      .trim()
      .split(/[\s-_]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
	);
}
