import * as React from "react";
import { IOHLCData } from "./iOHLCData";

interface WithOHLCDataProps {
    readonly data: IOHLCData[];
}

interface WithOHLCState {
    data?: IOHLCData[];
    message: string;
}

export function withAPIData(apidata: any) {
    return <TProps extends WithOHLCDataProps>(OriginalComponent: React.ComponentClass<TProps>) => {
        return class WithOHLCData extends React.Component<Omit<TProps, "data">, WithOHLCState> {
            public constructor(props: Omit<TProps, "data">) {
                super(props);

                this.state = {
                    message: `Loading data...`,
                };
            }
            public render() {
                return <OriginalComponent {...(this.props as TProps)} data={apidata} />;
            }
        };
    };
}