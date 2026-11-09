import { IconCircleFilled, IconMoonFilled } from "@tabler/icons-react";

type ThemeButtonProps = {
    busy: boolean;
    lightMode: boolean;
    onToggle: (button: HTMLButtonElement) => void;
};

// Renders the theme action and its matching icon, supplying the control as the reveal origin.
export function ThemeButton({ busy, lightMode, onToggle }: ThemeButtonProps) {
    const ModeIcon = lightMode ? IconCircleFilled : IconMoonFilled;

    return (
        <button
            className="navigation-theme-button"
            type="button"
            aria-label={lightMode ? "Switch to dark mode" : "Switch to light mode"}
            aria-disabled={busy || undefined}
            tabIndex={busy ? -1 : undefined}
            onClick={(event) => { if (!busy) onToggle(event.currentTarget); }}
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
