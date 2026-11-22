/**
 * The corner radius for a view inset by `padding` inside one rounded by `outer`, so both corners curve around the same
 * centre. Copying the container's radius makes the inner corner look too round. Never below `min`, so a large inset
 * doesn't square the corner off.
 */
export const innerRadius = (outer: number, padding: number, min = 2) => Math.max(outer - padding, min);
