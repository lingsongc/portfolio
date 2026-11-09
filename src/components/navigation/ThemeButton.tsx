import { useLayoutEffect, useState } from "react";
import { IconCircleFilled, IconMoonFilled } from "@tabler/icons-react";

type ThemeButtonProps = {
    busy: boolean;
};

// Switches the document palette and keeps the center symbol in sync with the active theme.
export function ThemeButton({ busy }: ThemeButtonProps) {
    const [lightMode, setLightMode] = useState(false);
    const ModeIcon = lightMode ? IconCircleFilled : IconMoonFilled;

    // Apply the palette before paint so its icon and colours change together without a fade.
    useLayoutEffect(() => {
        document.documentElement.dataset.theme = lightMode ? "light" : "dark";
    }, [lightMode]);

    return (
        <button
            className="navigation-theme-button"
            type="button"
            aria-label={lightMode ? "Switch to dark mode" : "Switch to light mode"}
            aria-disabled={busy || undefined}
            tabIndex={busy ? -1 : undefined}
            onClick={() => { if (!busy) setLightMode((current) => !current); }}
        >
            <svg className="navigation-theme-star" viewBox="0 0 56 56" aria-hidden="true">
                {/* Cover both squares' internal strokes together to leave one opaque perimeter. */}
                <g className="navigation-theme-outline" strokeLinejoin="round">
                    <rect x="12" y="12" width="32" height="32" />
                    <rect x="12" y="12" width="32" height="32" transform="rotate(45 28 28)" />
                </g>
                <g className="navigation-theme-surface">
                    <rect x="12" y="12" width="32" height="32" />
                    <rect x="12" y="12" width="32" height="32" transform="rotate(45 28 28)" />
                </g>
            </svg>
            <ModeIcon className="navigation-theme-icon" size={24} aria-hidden="true" />
        </button>
    );
}
