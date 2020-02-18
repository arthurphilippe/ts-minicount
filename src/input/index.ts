import number, { scene as sceneInputNumber } from "./number";
import stringMca, { scene as sceneInputStringMca } from "./stringMca";

export { number, stringMca };

import * as telegraf from "telegraf";

export function register(stage: telegraf.Stage<any>) {
    stage.register(sceneInputNumber, sceneInputStringMca);
}

export let stage = new telegraf.Stage<any>([sceneInputNumber, sceneInputStringMca]);
