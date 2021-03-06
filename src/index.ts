import * as telegraf from "telegraf_acp_fork";

interface Operations {
    name: string;
    value: number;
    accountId: any;
}

import myContext from "./Context";
import InlineQuery from "./InlineQuery";

import * as account from "./account";
import * as input from "./input";
import * as task from "./task";

import Db from "./Db";

(async () => {
    let bot = new telegraf.default<myContext>(process.env.BOT_TOKEN);
    let db = new Db();
    await db.start();
    bot.use((ctx, next) => {
        db.middleware(ctx, next);
        ctx.taskSceduler = new task.Scheduler(ctx.telegram, db);
        ctx.taskSceduler.schedule();
    });

    bot.on(
        "callback_query",
        (ctx, next) => {
            console.log("callbackquery");
            ctx.splitCb = ctx.callbackQuery.data.split(";");
            next();
        },
        task.cb
    );

    let stage = new telegraf.Stage([]);
    account.register(stage);
    input.register(stage);
    task.register(stage);

    stage.command("cancel", (ctx) => {
        ctx.scene.leave();
    });

    bot.on("chosen_inline_result", (ctx) => {
        console.log("chosen");
        // ctx.reply("no idea");
    });

    bot.use(telegraf.session<myContext>());
    bot.use(stage.middleware());
    bot.command("newaccount", (ctx) => ctx.scene.enter("createAccount"));
    bot.command("newoperation", (ctx) => ctx.scene.enter("newOperation"));
    bot.command("editaccount", (ctx) => ctx.scene.enter("editAccount"));
    bot.command("listaccounts", async (ctx) =>
        ctx.reply(await account.listAllByRef(ctx.accounts, ctx.message.chat.id))
    );

    bot.command("newtask", (ctx) => ctx.scene.enter("createTask"));

    bot.command("newcrate", (ctx) => {
        ctx.scene.enter("newCrate");
    });
    bot.command("deletecrate", (ctx) => {
        ctx.scene.enter("deleteCrate");
    });

    bot.on("inline_query", InlineQuery);

    bot.on("message", (ctx) => {
        // ctx.message.fo
        ctx.reply("Not sure what you are trying to do... Have a look at available commands.");
        ctx.reply(`you are in ${ctx.scene.session.current}`);
        // bot.telegram.forwardMessage()
    });

    console.log("Ready...");
    bot.catch((err: any) => {
        console.error(err);
        db.client.close();
    });
    bot.startPolling();
})();
