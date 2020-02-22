import * as telegraf from "telegraf_acp_fork";
import * as tt from "telegraf/typings";

import Crate, * as crate from "./Crate";

interface Operations {
    name: string;
    value: number;
    accountId: any;
}

import myContext from "./Context";
import InlineQuery from "./InlineQuery";

import * as account from "./account";
import * as input from "./input";

import * as mongodb from "mongodb";

class Db {
    client: mongodb.MongoClient;
    db: mongodb.Db;

    constructor() {
        this.client = new mongodb.MongoClient("mongodb://root:example@localhost", {
            useUnifiedTopology: true,
        });
    }

    public async start() {
        this.client = await this.client.connect();
        this.db = this.client.db("minicount");
        return;
    }
    public middleware<TContext extends myContext>(ctx: TContext, next: Function) {
        if (!this.client.isConnected()) {
            throw "db middware cannot be used without being connected.";
        }
        ctx.accounts = new account.Accounts(this.db);
        ctx.crates = new crate.Crates(this.db);
        next();
    }
}

(async () => {
    let bot = new telegraf.default<myContext>(process.env.BOT_TOKEN);
    let db = new Db();
    await db.start();
    bot.use((ctx, next) => {
        db.middleware(ctx, next);
    });

    let stage = new telegraf.Stage([]);
    account.register(stage);
    input.register(stage);

    stage.command("cancel", (ctx) => {
        ctx.scene.leave();
    });

    bot.use(telegraf.session<myContext>());
    bot.use(stage.middleware());
    bot.command("newaccount", (ctx) => ctx.scene.enter("createAccount"));
    bot.command("newoperation", (ctx) => ctx.scene.enter("newOperation"));
    bot.command("editaccount", (ctx) => ctx.scene.enter("editAccount"));
    bot.command("listaccounts", async (ctx) =>
        ctx.reply(await account.listAllByRef(ctx.accounts, ctx.message.chat.id))
    );

    bot.command("newcrate", (ctx) => {
        ctx.scene.enter("newCrate");
    });
    bot.command("deletecrate", (ctx) => {
        ctx.scene.enter("deleteCrate");
    });

    bot.on("inline_query", InlineQuery);

    bot.on("callback_query", (ctx) => {
        console.log("callbackquery");
        ctx.editMessageText("voiture");
    });

    bot.on("chosen_inline_result", (ctx) => {
        console.log("chosen");
        // ctx.reply("no idea");
    });

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
