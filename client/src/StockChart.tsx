import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import * as React from "react";
import {
    discontinuousTimeScaleProviderBuilder,
    Chart,
    ChartCanvas,
    BarSeries,
    CandlestickSeries,
    OHLCTooltip,
    lastVisibleItemBasedZoomAnchor,
    XAxis,
    YAxis,
    CrossHairCursor,
    EdgeIndicator,
    MouseCoordinateX,
    MouseCoordinateY
} from "react-financial-charts";
import { IOHLCData } from "./iOHLCData"

const style = getComputedStyle(document.body);
const redColor = style.getPropertyValue('--bs-danger');
const greenColor = style.getPropertyValue('--bs-success');

interface StockChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly dateTimeFormat?: string;
    readonly width: number;
    readonly ratio: number;
}

export class StockChart extends React.Component<StockChartProps> {
    private readonly margin = { left: 0, right: 55, top: 0, bottom: 24 };
    private readonly pricesDisplayFormat = format(".2f");
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => new Date(Number(d.timestamp))
    );

    public render() {
        const { data: initialData, dateTimeFormat = "%X %x", height, ratio, width } = this.props;

        const { margin, xScaleProvider } = this;

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max + 5];

        const gridHeight = height - margin.top - margin.bottom;

        const barChartHeight = gridHeight / 4;
        const barChartOrigin = (_: number, h: number) => [0, h - barChartHeight];
        const chartHeight = gridHeight;

        const timeDisplayFormat = timeFormat(dateTimeFormat);

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
                zoomAnchor={lastVisibleItemBasedZoomAnchor}
            >
                <Chart id={2} height={barChartHeight} origin={barChartOrigin} yExtents={this.barChartExtents}>
                    <BarSeries fillStyle={this.volumeColor} yAccessor={this.volumeSeries} />
                </Chart>
                <Chart id={3} height={chartHeight} yExtents={this.candleChartExtents}>
                    <XAxis showGridLines showTickLabel={false} />
                    <YAxis showGridLines tickFormat={this.pricesDisplayFormat} />
                    <CandlestickSeries fill={this.barsColor} wickStroke={this.barsColor}/>
                    <MouseCoordinateY rectWidth={margin.right} displayFormat={this.pricesDisplayFormat} />
                    <MouseCoordinateX displayFormat={timeDisplayFormat} />
                    <EdgeIndicator
                        itemType="last"
                        rectWidth={margin.right}
                        fill={this.openCloseColor}
                        lineStroke={this.openCloseColor}
                        displayFormat={this.pricesDisplayFormat}
                        yAccessor={this.yEdgeIndicator}
                    />
                    <OHLCTooltip origin={[8, 16]} />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }

    private readonly barChartExtents = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly candleChartExtents = (data: IOHLCData) => {
        return [data.high, data.low];
    };

    private readonly yEdgeIndicator = (data: IOHLCData) => {
        return data.close;
    };

    private readonly volumeColor = (data: IOHLCData) => {
        return data.close > data.open ? "rgba(16, 196, 105, 0.3)" : "rgba(255, 91, 91, 0.3)";
    };

    private readonly volumeSeries = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly openCloseColor = (data: IOHLCData) => {
        return data.close > data.open ? greenColor : redColor;
    };

    private readonly barsColor = (data: IOHLCData) => {
        return data.close > data.open ? greenColor : redColor;
    };
}