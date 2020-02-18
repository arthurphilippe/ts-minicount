import * as telegraf from "telegraf";
import myContext from "../Context";

let greeter = new telegraf.BaseScene<myContext>("greeter");
greeter.enter((ctx) => {
    ctx.reply("Entered greeter!");
});

greeter.leave((ctx) => {
    ctx.reply("Left the greeter");
});

greeter.hears(/hi/gi, (ctx) => {
    ctx.scene.leave();
});

import createAccount from "./sceneCreateAccount";
import newOperation from "./sceneNewOperation";
import editAccount from "./sceneEditAccount";

export function register(stage: telegraf.Stage<any>) {
    stage.register(greeter, createAccount, newOperation, editAccount);
}

export let stage = new telegraf.Stage([greeter, createAccount, newOperation, editAccount]);

stage.command("back", (ctx) => {
    ctx.scene.leave();
});

stage.command("cancel", (ctx) => {
    ctx.scene.leave();
});

export * from "./Account";
