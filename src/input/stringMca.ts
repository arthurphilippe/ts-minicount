import * as telegraf from "telegraf";
import myContext from "../Context";
import Replies from "./Replies";
import inputStateBase from "./inputStateBase";

interface inputState extends inputStateBase {
    choices: string[];
    allowIncorrect: boolean;
}

export default function stringMca(
    ctx: myContext,
    choices: string[],
    allowIncorrect: boolean = false,
    allowRetry: boolean = false,
    replies: Replies = {
        success: "Number received",
        failure: "Failed to understand given number.",
        question: "Input a number:",
    }
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let scn_ctx: Partial<inputState> = {
            resolve,
            reject,
            replies,
            allowRetry,
            allowIncorrect,
            choices,
            old: {
                state: ctx.scene.state,
                id: ctx.scene.session.current,
            },
        };

        ctx.scene.enter("inputMca", scn_ctx);
    });
}

export let scene = new telegraf.BaseScene<myContext>("inputMca");

scene.enter((ctx) => {
    ctx.reply("Entering mca");

    let state = ctx.scene.state as inputState;
    ctx.reply(
        state.replies.question,
        telegraf.Markup.keyboard(state.choices)
            .oneTime()
            .resize()
            .extra()
    );
});

scene.leave((ctx) => {
    ctx.reply("leaving mca");
    let state = ctx.scene.state as inputState;

    ctx.scene.enter(state.old.id, state.old.state);
});

scene.on("message", (ctx) => {
    let state = ctx.scene.state as inputState;

    if (state.allowIncorrect || ctx.message.text in state.choices) {
        if (state.replies.success) ctx.reply(state.replies.success);
        ctx.scene.leave();
        state.resolve(ctx.message);
    } else {
        ctx.reply(state.replies.failure);
        if (!state.allowRetry) {
            ctx.scene.leave();
            state.reject(new Error("String not in choices."));
        } else {
            ctx.reply("You may retry or /cancel.");
        }
    }
});
