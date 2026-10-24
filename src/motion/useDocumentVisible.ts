import { useEffect, useState } from "react";

// Reports tab visibility so section-owned decorative motion can pause in place.
export function useDocumentVisible() {
    const [visible, setVisible] = useState(() => !document.hidden);
    useEffect(() => {
        const updateVisibility = () => setVisible(!document.hidden);
        document.addEventListener("visibilitychange", updateVisibility);
        updateVisibility();
        return () => document.removeEventListener("visibilitychange", updateVisibility);
    }, []);
    return visible;
}
