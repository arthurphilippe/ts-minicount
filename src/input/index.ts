import number, { scene as sceneInputNumber } from "./number";
import stringMca, { scene as sceneInputStringMca } from "./stringMca";
import time, { scene as sceneInputTime } from "./time";
import string, { scene as sceneInputString } from "./string";

export { number, stringMca, string, time };

import * as telegraf from "telegraf_acp_fork";

export function register(stage: telegraf.Stage<any>) {
    stage.register(sceneInputNumber, sceneInputStringMca, sceneInputString, sceneInputTime);
}

export let stage = new telegraf.Stage<any>([
    sceneInputNumber,
    sceneInputStringMca,
    sceneInputString,
    sceneInputTime,
]);
