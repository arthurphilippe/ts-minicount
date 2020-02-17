import * as telegraf from "telegraf";
import myContext from "../Context";
import Replies from "./Replies";
import inputContextBase from "./inputContextBase";

interface inputContext extends inputContextBase {
    type: "INT" | "FLOAT";
}

export default function number(
    this: myContext,
    type: "INT" | "FLOAT",
    allowRetry: boolean = false,
    replies: Replies = {
        success: "Number received",
        failure: "Failed to understand given number.",
        question: "Input a number:",
    }
): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        let ctx: Partial<inputContext> = {
            resolve,
            reject,
            replies: replies,
            allowRetry,
            type,
        };

        this.scene.enter("inputNumber", ctx);
    });
}

let scene = new telegraf.BaseScene<inputContext>("inputNumber");

scene.enter((ctx) => {
    if (ctx.replies.question) ctx.reply(ctx.replies.question);
});

scene.hears(/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/, async (ctx) => {
    let value = ctx.type === "FLOAT" ? parseFloat(ctx.message.text) : parseInt(ctx.message.text);
    if (isNaN(value)) {
        ctx.reply(ctx.replies.failure);
        if (ctx.allowRetry) ctx.reply("You may retry or /cancel.");
        else {
            ctx.scene.leave();
            ctx.reject(new Error("Not a number"));
        }
    } else {
        ctx.scene.leave();
        ctx.resolve(value);
    }
});
