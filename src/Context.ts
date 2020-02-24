import { Accounts } from "./account";
import { Crates } from "./Crate";
import * as task from "./task";
import * as telegraf from "telegraf_acp_fork";

export default interface Context extends telegraf.SceneContextMessageUpdate {
    crates?: Crates;
    accounts?: Accounts;
    tasks?: task.Tasks;
    occurences?: task.Occurences;
    taskSceduler?: task.Scheduler;
    splitCb?: string[];
}
