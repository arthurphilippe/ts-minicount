import Account, { isAccount } from "./Account";
import myContext from "../Context";
import * as telegraf from "telegraf_acp_fork";
import * as currency from "currency.js";
import { getAccountNames } from "./getAccountNames";
import { askForAccountName } from "./askForAccountName";
import { replyAndLeave } from "../replyAndLeave";

let sceneId = "newOperation";
let newOperation = new telegraf.BaseScene<myContext>(sceneId);

export default newOperation;

async function fetchAccount(ctx: myContext, acc: string): Promise<Account> {
    try {
        let account = await ctx.accounts.collection.findOne({ name: acc });
        if (!account) throw new Error("Something went wrong while retrieving the account.");

        ctx.scene.session.state = account;
        ctx.reply(`🟢 Account retrived. ${account.balance} left on ${account.name}.`);
        return account;
    } catch (err) {
        throw new Error("I may have some issues with my database.");
    }
}

function askForOperation(ctx: myContext, account: Account) {
    let buttons = [];
    if (account.typicalOperations) {
        account.typicalOperations.forEach((typicalOp) => {
            let button = telegraf.Markup.callbackButton(typicalOp.name, typicalOp.value.toString());
            buttons.push(button);
        });
        ctx.reply(
            "Chose from a typical operation or type-in a value.",
            telegraf.Markup.keyboard(buttons)
                .oneTime()
                .resize()
                .extra()
        );
    } else {
        ctx.reply("How much was it? (Use negative values for expenses and positive for income.)");
    }
}

newOperation.enter((ctx) => {
    getAccountNames(ctx)
        .catch(replyAndLeave.bind(ctx))
        .then((accs_names) => {
            askForAccountName(ctx, accs_names)
                .catch(replyAndLeave.bind(ctx))
                .then((choice) => {
                    fetchAccount(ctx, choice)
                        .catch(replyAndLeave.bind(ctx))
                        .then((account) => {
                            askForOperation(ctx, account);
                        });
                });
        });
});

async function applyOperationChange(ctx: myContext, value: number) {
    let account = ctx.scene.session.state as Account;

    let newBal = currency(account.balance).add(value);

    let result = await ctx.accounts.collection.findOneAndUpdate(
        { name: account.name },
        { $set: { balance: newBal.value } },
        { returnOriginal: false }
    );
    if (result.ok) {
        let editedAccount = result.value;
        ctx.reply(`🟢 Succes!\nBalance for ${editedAccount.name} is now ${editedAccount.balance}`);
        ctx.scene.leave();
    } else {
        ctx.reply(`Error while trying to apply operation.`);
        // ctx.scene.reenter();
    }
}

newOperation.hears(/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/, async (ctx, next) => {
    if (!isAccount(ctx.scene.state)) {
        next();
    }

    return applyOperationChange(ctx, currency(ctx.message.text).value);
});

async function selectTypicalOp(ctx: myContext) {
    let name = ctx.message.text;
    let account = ctx.scene.session.state as Account;

    let op: {
        name: string;
        value: number;
    } = undefined;
    if (!account.typicalOperations) {
        ctx.reply("No typical operations for " + account.name);
        ctx.reply("I was expeting a numeric value.");
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
    return applyOperationChange(ctx, op.value);
}

newOperation.on("text", (ctx) => {
    if (!isAccount(ctx.scene.state)) {
        ctx.reply("Account has not yet been selected. An error may have occured.");
    }
    selectTypicalOp(ctx);
});
