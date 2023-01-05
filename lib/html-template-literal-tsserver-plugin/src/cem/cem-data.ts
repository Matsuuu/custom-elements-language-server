import { Package } from "custom-elements-manifest";

export interface CEMData {
    cem: Package;
    paths: {
        cem: string;
        project: string;
    }
    packageName: string;
}
