import * as telegraf from "telegraf";
import myContext from "../Context";
import createAccount from "./createAccount";
import newOperation from "./newOperation";
import editAccount from "./editAccount";

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

export let stage = new telegraf.Stage([greeter, createAccount, newOperation, editAccount]);

stage.command("back", (ctx) => {
    ctx.scene.leave();
});

stage.command("cancel", (ctx) => {
    ctx.scene.leave();
});

export * from "./Account";
