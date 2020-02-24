import * as telegraf from "telegraf_acp_fork";
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
        success: "String from multiple choices OK",
        failure: "String from multiple choices NOK",
        question: "Input a from keyboard.",
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
        };

        ctx.scene.enter("inputMca", scn_ctx, false, true);
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
});

scene.on("text", (ctx) => {
    let state = ctx.scene.state as inputState;

    let match = false;
    state.choices.forEach((choice) => {
        if (!match && choice.includes(ctx.message.text)) {
            match = true;
        }
    });

    if (state.allowIncorrect || match) {
        if (state.replies.success) ctx.reply(state.replies.success);
        ctx.scene.leave();
        state.resolve(ctx.message.text);
    } else {
        if (state.replies.failure) ctx.reply(state.replies.failure);
        if (!state.allowRetry) {
            ctx.scene.leave();
            state.reject(new Error("String not in choices."));
        } else {
            ctx.reply("You may retry or /cancel.");
        }
    }
});
