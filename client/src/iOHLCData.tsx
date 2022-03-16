export interface IOHLCData {
    readonly close: number;
    readonly timestamp: number;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly volume: number;
}