type RevealOrigin = Pick<DOMRect, "left" | "top" | "width" | "height">;

// Covers the farthest viewport corner from the control's center, with one pixel of overscan.
export function themeTransitionGeometry(bounds: RevealOrigin, width: number, height: number) {
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.ceil(Math.hypot(Math.max(x, width - x), Math.max(y, height - y))) + 1;
    return { x, y, radius };
}
