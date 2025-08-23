export default alpha;

function alpha (color, value) {
	// Fallback to black if color is null/undefined
	if (color == null) {
		color = 'rgba(0,0,0,1)';
	}
	let obj = color.replace(/[^\d,]/g, '').split(',');
	if (value == null) value = obj[3] || 1;
	obj[3] = value;
	return 'rgba('+obj.join(',')+')';
}
