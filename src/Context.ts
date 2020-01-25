import { Accounts } from "./Account";
import * as telegraf from "telegraf";
export default interface Context extends telegraf.SceneContextMessageUpdate {
    // session:
    accounts?: Accounts;
}
