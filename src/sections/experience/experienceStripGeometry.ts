// Resolves native horizontal snap offsets without allowing rubber-band overscroll past an entry.
export function snappedEntryIndex(scrollLeft: number, step: number, count: number) {
    if (step <= 0 || count <= 0) return 0;
    return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}
