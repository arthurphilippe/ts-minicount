import * as telegraf from "telegraf";
import myContext from "../Context";
import Replies from "./Replies";
import inputStateBase from "./inputStateBase";

interface inputState extends inputStateBase {
    type: "INT" | "FLOAT";
}

export default function number(
    ctx: myContext,
    type: "INT" | "FLOAT",
    allowRetry: boolean = false,
    replies: Replies = {
        success: "Number received",
        failure: "Failed to understand given number.",
        question: "Input a number:",
    }
): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        let scn_ctx: Partial<inputState> = {
            resolve,
            reject,
            replies: replies,
            allowRetry,
            type,
            old: {
                state: ctx.scene.state,
                id: ctx.scene.session.current,
            },
        };

        ctx.scene.enter("inputNumber", scn_ctx);
    });
}

export let scene = new telegraf.BaseScene<myContext>("inputNumber");
scene.leave((ctx) => {
    ctx.reply("leaving number");
});

scene.enter((ctx) => {
    let state = ctx.scene.state as inputState;

    if (state.replies.question) ctx.reply(state.replies.question);
});

scene.hears(/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/, async (ctx) => {
    let state = ctx.scene.state as inputState;

    let value = state.type === "FLOAT" ? parseFloat(ctx.message.text) : parseInt(ctx.message.text);
    if (isNaN(value)) {
        ctx.reply(state.replies.failure);
        if (state.allowRetry) ctx.reply("You may retry or /cancel.");
        else {
            ctx.scene.leave();
            state.reject(new Error("Not a number"));
        }
    } else {
        ctx.scene.leave();
        state.resolve(value);
    }
});
