import * as telegraf from "telegraf";

import Account, { Accounts } from "./Account";

interface Operations {
    name: string;
    value: number;
    accountId: any;
}

import myContext from "./Context";

import * as scene from "./scene";

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
        ctx.accounts = new Accounts(this.db);
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
    bot.use(telegraf.session<myContext>());
    bot.use(scene.stage.middleware());
    bot.command("createAccount", (ctx) => ctx.scene.enter("createAccount"));
    bot.command("greeter", (ctx) => ctx.scene.enter("greeter"));
    bot.command("voiture", (ctx) => ctx.reply("J'aime le voiture"));
    console.log("Ready...");
    bot.startPolling();
})();
