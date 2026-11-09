type HomeButtonProps = {
    busy: boolean;
    active: boolean;
    onHomeRequest: () => void;
};

// Keeps the logo available as a Home control outside every scene's scrolling content.
export function HomeButton({ busy, active, onHomeRequest }: HomeButtonProps) {
    return (
        <button
            className="home-button"
            type="button"
            aria-label="Home"
            aria-current={active ? "location" : undefined}
            aria-disabled={busy || undefined}
            tabIndex={busy ? -1 : undefined}
            onClick={() => { if (!busy) onHomeRequest(); }}
        >
            <img src={`${import.meta.env.BASE_URL}shared/logo.svg`} alt="" />
        </button>
    );
}
