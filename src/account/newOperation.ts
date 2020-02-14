import Account from "./Account";
import myContext from "../Context";
import * as telegraf from "telegraf";
import * as currency from "currency.js";

let newOperation = new telegraf.BaseScene<myContext>("newOperation");

export default newOperation;

// interface State {
//     accName: string;
//     opValue: number;
//     opDesc: string;
// }

newOperation.enter(async (ctx) => {
    let cursor = ctx.accounts.collection.find(
        { referenceId: ctx.chat.id },
        { projection: { name: 1 } }
    );
    let accs = await cursor.toArray();

    if (!accs.length) {
        ctx.reply(
            "You need to create an account before trying to perform an opertion. You can use /createaccount."
        );
        ctx.scene.leave();
        return;
    }

    let accs_names: string[] = [];
    accs.forEach((elem) => {
        accs_names.push(elem.name);
    });

    ctx.scene.session.state = undefined;
    return ctx.reply(
        "Chose account to perform operation on:",
        telegraf.Markup.keyboard(accs_names)
            .oneTime()
            .resize()
            .extra()
    );
});

newOperation.leave((ctx) => {
    ctx.reply("Leaving operation creation.");
});

newOperation.hears(/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/, async (ctx, next) => {
    if (!ctx.scene.session.state) {
        next();
    }
    let account = ctx.scene.session.state as Account;

    let newBal = currency(account.balance).add(ctx.message.text);

    let result = await ctx.accounts.collection.findOneAndUpdate(
        { name: account.name },
        { $set: { balance: newBal.value } },
        { returnOriginal: false }
    );
    if (result.ok) {
        let editedAccount = result.value;
        ctx.reply(`Balance for ${editedAccount.name} is now ${editedAccount.balance}`);
        ctx.scene.leave();
    } else {
        ctx.reply(`Error while trying to apply operation.`);
        ctx.scene.reenter();
    }
});

async function selectAccount(ctx: myContext) {
    let targetAccName: string = ctx.message.text;

    let account = await ctx.accounts.collection.findOne({ name: targetAccName });
    if (!account) {
        ctx.reply("Could not find account");
        ctx.scene.leave();
        return;
    }
    ctx.scene.session.state = account;
    let buttons = [];
    if (account.typicalOperations) {
        account.typicalOperations.forEach((typicalOp) => {
            let button = telegraf.Markup.callbackButton(typicalOp.name, typicalOp.value.toString());
            buttons.push(button);
        });
        ctx.reply(
            "Chose from a typical operation or type in a value.",
            telegraf.Markup.keyboard(buttons)
                .oneTime()
                .resize()
                .extra()
        );
    } else {
        ctx.reply("How much was it? (Use negative values for expenses and positive for income.)");
    }
    return;
}

async function selectTypicalOp(ctx: myContext) {
    let name = ctx.message.text;
    let account = ctx.scene.session.state as Account;

    let op: {
        name: string;
        value: number;
    } = undefined;
    if (!account.typicalOperations) {
        ctx.reply("No typical operations for " + account.name);
        return;
    }
    account.typicalOperations.forEach((element) => {
        if (element.name == name) op = element;
    });

    if (!op) {
        ctx.reply(
            "This doesn't look like a number or an operation name.\nFeel free to retry or to go /back."
        );
        return;
    }
    let newBal = currency(account.balance).add(op.value);
    // if (op) += op.value;

    let result = await ctx.accounts.collection.findOneAndUpdate(
        { name: account.name },
        { $set: { balance: newBal.value } },
        { returnOriginal: false }
    );
    if (result.ok) {
        let editedAccount = result.value;
        ctx.reply(`Balance for ${editedAccount.name} is now ${editedAccount.balance}`);
        ctx.scene.leave();
    } else {
        ctx.reply(`Error while trying to apply operation.`);
        ctx.scene.reenter();
    }
    return;
}

newOperation.on("text", (ctx) => {
    if (!ctx.scene.session.state) {
        selectAccount(ctx);
    } else {
        selectTypicalOp(ctx);
    }
});
