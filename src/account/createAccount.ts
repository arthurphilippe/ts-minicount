import Account from "./Account";
import myContext from "../Context";
import * as telegraf from "telegraf";

let createAccount = new telegraf.BaseScene<myContext>("createAccount");

export default createAccount;

createAccount.enter((ctx) =>
    ctx.reply("Alright, let's open a new account!\nHow do you want to call it?")
);

createAccount.leave((ctx) => ctx.reply("Leaving account creation."));

function parseAccountName(account: Account, ctx: myContext): string[] {
    let builder: string[] = [];
    account.name = ctx.message.text;
    if (account.name)
        builder.push(
            `Great, we will call it ${account.name}!`,
            `Now, tell me how much balance there is on that account.`
        );
    else {
        builder.push("I'm not sure I got that...", "What did you say the name of the account was?");
    }
    return builder;
}
function parseAccountBalance(account: Account, ctx: myContext): string[] {
    let builder: string[] = [];
    account.balance = parseFloat(ctx.message.text.split(" ", 1)[0]);
    if (!isNaN(account.balance)) {
        builder.push(
            `Balance for ${account.name} is now ${account.balance.toFixed(2)}.`,
            `You can now say /done or tell me the kind of recuring operation to expect on this account.`,
            ``,
            `Format your messages like so: "name of operation, value";`,
            `e.i. "regular wash, 4.80"`
        );
    } else {
        builder.push("I'm not sure I got that...", "How much did you say the balance was?");
    }
    return builder;
}

function parseTypicalOp(account: Account, ctx: myContext): string[] {
    let builder: string[] = [];

    let opNameAndValue = ctx.message.text.split(",", 2);
    if (opNameAndValue.length < 2 && opNameAndValue[0].length) {
        builder.push(
            `Format your messages like so: "name of operation, value";`,
            `e.i. "regular wash, -4.80".`,
            `Note: if the operation is an expense, its value should be negative.`,
            ``,
            "Alternatively, say /done."
        );
    } else {
        let valueStr = opNameAndValue[1].split(" ");
        let value = parseFloat(valueStr[valueStr.length - 1]);
        if (!isNaN(value)) {
            if (!account.typicalOperations) {
                account.typicalOperations = [];
            }
            account.typicalOperations.push({ name: opNameAndValue[0], value: value });
            builder.push(`Typical operations for ${account.name} are:`);
            account.typicalOperations.forEach((op) => {
                console.log(op);
                builder.push(`- ${op.name}, ${op.value.toFixed(2)}`);
            });
        } else {
            builder.push(`${valueStr.join()} doesn't parse as a number.`);
        }
    }
    return builder;
}

// createAccount.command("done", telegraf.Stage.leave);
createAccount.command("done", async (ctx) => {
    let account = ctx.scene.session.state as Account;
    account.referenceId = ctx.chat.id;

    try {
        await ctx.accounts.collection.insertOne(account);
        ctx.reply("Account saved!");
        ctx.scene.leave();
    } catch (err) {
        console.error(err);
        ctx.reply(
            "Something went wrong when saving that new account...\nYou can still retry with /done or go /back."
        );
    }
});

createAccount.on("text", (ctx) => {
    let account = ctx.scene.session.state as Account;
    let builder: string[];
    if (!account.name) {
        builder = parseAccountName(account, ctx);
    } else if (account.balance === undefined || isNaN(account.balance)) {
        builder = parseAccountBalance(account, ctx);
    } else {
        builder = parseTypicalOp(account, ctx);
    }
    ctx.scene.session.state = account;
    return ctx.reply(builder.join("\n"));
});
