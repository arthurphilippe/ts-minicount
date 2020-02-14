import { Accounts } from "./account";
import { Crates } from "./Crate";
import * as telegraf from "telegraf";
export default interface Context extends telegraf.SceneContextMessageUpdate {
    // session:
    crates?: Crates;
    accounts?: Accounts;
}
