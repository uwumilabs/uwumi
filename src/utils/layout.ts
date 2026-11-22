/**
 * The corner radius for a view inset by `padding` inside one rounded by `outer`, so both corners curve around the same
 * centre. Copying the container's radius makes the inner corner look too round. Never below 2, so a large inset
 * doesn't square the corner off.
 */
export const innerRadius = (outer: number, padding: number) => Math.max(outer - padding, 2);
