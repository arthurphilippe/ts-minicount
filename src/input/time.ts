import * as telegraf from "telegraf_acp_fork";
import myContext from "../Context";
import Replies from "./Replies";
import inputStateBase from "./inputStateBase";

interface inputState extends inputStateBase {
    hours?: number;
}

interface time {
    minutes: number;
    hours: number;
}

export default function time(
    ctx: myContext,
    allowRetry: boolean = false,
    replies: Replies = {
        success: "🟢 Time received.",
        failure: "🔴 Failed to understand time of day, aborting.",
        question: "At what time? Input a time (HH:MM) in 24 hours format.",
    }
): Promise<time> {
    return new Promise<time>((resolve, reject) => {
        let scn_ctx: Partial<inputState> = {
            resolve,
            reject,
            replies: replies,
            allowRetry,
            hours: undefined,
        };

        ctx.scene.enter("inputTime", scn_ctx, false, true);
    });
}

export let scene = new telegraf.BaseScene<myContext>("inputTime");
// scene.leave((ctx) => {});

scene.enter((ctx) => {
    let state = ctx.scene.state as inputState;

    if (state.replies.question) ctx.reply(state.replies.question);
});

function failOrRetry(ctx: myContext, errmsg: string) {
    let state = ctx.scene.state as inputState;
    if (!state.allowRetry) {
        if (state.replies.failure) ctx.reply(state.replies.failure);
        ctx.scene.leave();
        state.reject(new Error(errmsg));
    }
}

function succeed(ctx: myContext, value: time) {
    let state = ctx.scene.state as inputState;
    if (state.replies.success) ctx.reply(state.replies.success);
    ctx.scene.leave();
    state.resolve(value);
}

scene.on("text", (ctx) => {
    let splitText = ctx.message.text.split(":");

    if (splitText.length < 2) {
        ctx.reply('I was expecting hours and minutes as "HH:MM" in 24 hours format.');
        failOrRetry(ctx, "Input format incorrect");
    } else {
        let hours = parseInt(splitText[0]);
        let minutes = parseFloat(splitText[1]);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            ctx.reply("Hours must be positive and bellow 24.\nMinutes must be bellow 60.");
            failOrRetry(ctx, "Input format incorrect");
        } else {
            succeed(ctx, { minutes, hours });
        }
    }
});
