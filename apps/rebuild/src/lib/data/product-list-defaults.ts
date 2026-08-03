// Divisible by the store grid's 2/3/4-column breakpoints, so every
// page fills complete rows with no ragged trailing partial row.
//
// Lives outside products.ts because that file has "use server" at
// the top, which restricts its exports to async functions only —
// a plain constant can't be exported from there.
const DEFAULT_PRODUCTS_PER_PAGE = 24;

export { DEFAULT_PRODUCTS_PER_PAGE };
