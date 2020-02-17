import * as telegraf from "telegraf";
import myContext from "../Context";
import Replies from "./Replies";
import inputContextBase from "./inputContextBase";

interface inputContext extends inputContextBase {
    choices: string[];
    allowIncorrect: boolean;
}

export default function stringMca(
    this: myContext,
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
        let ctx: Partial<inputContext> = {
            resolve,
            reject,
            replies: replies,
            allowRetry,
            allowIncorrect,
            choices,
        };

        this.scene.enter("inputMca", ctx);
    });
}

let scene = new telegraf.BaseScene<inputContext>("inputMca");

scene.enter((ctx) => {
    ctx.reply(
        ctx.replies.question,
        telegraf.Markup.keyboard(ctx.choices)
            .oneTime()
            .resize()
            .extra()
    );
});

scene.on("message", (ctx) => {
    if (ctx.allowIncorrect || ctx.message.text in ctx.choices) {
        if (ctx.replies.success) ctx.reply(ctx.replies.success);
        ctx.scene.leave();
        ctx.resolve(ctx.message);
    } else {
        ctx.reply(ctx.replies.failure);
        if (!ctx.allowRetry) {
            ctx.scene.leave();
            ctx.reject(new Error("String not in choices."));
        } else {
            ctx.reply("You may retry or /cancel.");
        }
    }
});
