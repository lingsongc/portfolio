import { IconMoonFilled } from "@tabler/icons-react";

type ThemeButtonProps = {
    busy: boolean;
};

// Presents the two-part theme symbol while theme switching remains deferred.
export function ThemeButton({ busy }: ThemeButtonProps) {
    return (
        <button
            className="navigation-theme-button"
            type="button"
            aria-label="Colour theme (preview, switching unavailable)"
            aria-disabled="true"
            tabIndex={busy ? -1 : undefined}
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
            <IconMoonFilled className="navigation-theme-icon" size={24} aria-hidden="true" />
        </button>
    );
}
