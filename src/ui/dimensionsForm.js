const MIN_SIZE = 2;
const MAX_SIZE = 8;

function clamp(value) {
	return Math.min(MAX_SIZE, Math.max(MIN_SIZE, value));
}

/**
 * Subscribes to the three dimension inputs and reports changes via a callback.
 *
 * Reads values on every `input` event, so the model rebuilds live while
 * typing. Invalid/empty input is ignored (model stays as-is). Clamping into
 * [MIN_SIZE, MAX_SIZE] happens on `blur`, not `change` — `change` is
 * unreliable for type="number" on manual keyboard entry in some browsers.
 *
 * @param {(dimensions: {width: number, height: number, depth: number}) => void} onChange
 * @returns {{width: number, height: number, depth: number} | null} initial values read from the inputs
 */
export function createDimensionsForm(onChange) {
	const inputs = {
		width: document.querySelector('#input-width'),
		height: document.querySelector('#input-height'),
		depth: document.querySelector('#input-depth'),
	};

	function readDimensions() {
		const values = {};

		for (const [key, input] of Object.entries(inputs)) {
			const value = Number.parseFloat(input.value);
			if (!Number.isFinite(value)) return null;
			values[key] = clamp(value);
		}

		return values;
	}

	for (const input of Object.values(inputs)) {
		input.addEventListener('input', () => {
			const dimensions = readDimensions();
			if (dimensions) onChange(dimensions);
		});

		input.addEventListener('blur', () => {
			const value = Number.parseFloat(input.value);
			if (Number.isFinite(value)) input.value = String(clamp(value));

			const dimensions = readDimensions();
			if (dimensions) onChange(dimensions);
		});
	}

	return readDimensions();
}
