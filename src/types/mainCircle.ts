// Defines the shared geometry and transition contracts for the main circle.
export type MainCircleEndpoint = {
    width: number;
    top: number;
    left: number;
};

// Places the resting circle in a native scroller while keeping travel coordinates viewport-based.
export type MainCircleScrollPlacement = {
    host: HTMLDivElement;
    geometry: MainCircleEndpoint;
};
