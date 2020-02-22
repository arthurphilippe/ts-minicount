import Replies from "./Replies";

export default interface inputStateBase {
    resolve: (arg0: any) => void;
    reject: (err: any) => void;
    allowRetry: boolean;
    replies: Replies;
}
