import * as telegraf from "telegraf";
import Replies from "./Replies";

export default interface inputContextBase extends telegraf.SceneContextMessageUpdate {
    resolve: (arg0: any) => void;
    reject: (err: any) => void;
    allowRetry: boolean;
    replies: Replies;
}
