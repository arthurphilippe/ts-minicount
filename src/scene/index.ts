import * as telegraf from "telegraf";
import myContext from "../Context";
import createAccount from "./createAccount";

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

export let stage = new telegraf.Stage([greeter, createAccount]);

stage.command("back", (ctx) => {
    ctx.scene.leave();
});