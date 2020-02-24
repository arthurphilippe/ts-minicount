import * as telegraf from "telegraf_acp_fork";
import createTask from "./sceneCreateTask";

export function register(stage: telegraf.Stage<any>) {
    stage.register(createTask);
}

export * from "./Task";
export * from "./scheduler";
export * from "./cb";
