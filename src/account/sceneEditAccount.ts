import Account from "./Account";
import myContext from "../Context";
import * as telegraf from "telegraf_acp_fork";

let scene = new telegraf.BaseScene<myContext>("editAccount");

export default scene;

enum Action {
    None = 0,
    Name,
    Balance,
    Typical,
}

interface State {
    account?: Account;
    currentAction: Action;
}

scene.enter(async (ctx) => {
    let cursor = ctx.accounts.collection.find(
        { referenceId: ctx.chat.id },
        { projection: { name: 1 } }
    );
    let accs = await cursor.toArray();

    if (!accs.length) {
        ctx.reply(
            "You need to create an account before trying to edit one. You can use /createaccount."
        );
        ctx.scene.leave();
        return;
    }

    let accs_names: string[] = [];
    accs.forEach((elem) => {
        accs_names.push(elem.name);
    });

    let state: State = { account: undefined, currentAction: Action.None };
    ctx.scene.session.state = state;
    return ctx.reply(
        "Chose account to edit:",
        telegraf.Markup.keyboard(accs_names)
            .oneTime()
            .resize()
            .extra()
    );
});

scene.leave((ctx) => {
    ctx.reply("Leaving account edition.");
});

scene.command("name", (ctx) => {
    let state = ctx.scene.session.state as State;
    if (!state.account) {
        ctx.reply("You should select an account first.");
        ctx.scene.reenter();
    } else {
        state.currentAction = Action.Name;
        ctx.reply("How would you like to rename the account?");
    }
});

scene.command("balance", (ctx) => {
    let state = ctx.scene.session.state as State;
    if (!state.account) {
        ctx.reply("You should select an account first.");
        ctx.scene.reenter();
    } else {
        state.currentAction = Action.Balance;
        ctx.reply("What's the account balance?");
    }
});

scene.command("typicalexpenses", (ctx) => {
    let state = ctx.scene.session.state as State;
    if (!state.account) {
        ctx.reply("You should select an account first.");
        ctx.scene.reenter();
    } else {
        let builder: string[] = [];

        state.currentAction = Action.Typical;
        builder.push(
            `Tell me what are the typical expenses for this account and tell me when you are /done.`,
            ``,
            `Format your messages like so: "name of operation, value";`,
            `e.i. "regular wash, 4.80"`
        );

        if (state.account.typicalOperations) {
            builder.push(``, `Prior typical operations for ${state.account.name} were:`);

            state.account.typicalOperations.forEach((op) => {
                builder.push(`- ${op.name}, ${op.value.toFixed(2)}`);
            });
        }

        state.account.typicalOperations = [];
        ctx.reply(builder.join("\n"));
    }
});

scene.command("delete", async (ctx) => {
    let state = ctx.scene.session.state as State;
    if (!state.account) {
        ctx.reply("You should select an account first.");
        ctx.scene.reenter();
    } else {
        await ctx.accounts.collection.deleteOne({ name: state.account.name });
        ctx.reply("Deleted!");
        ctx.scene.leave();
    }
});

scene.command("done", async (ctx) => {
    let state = ctx.scene.session.state as State;
    let account = state.account;

    if (state.currentAction == Action.Typical) {
        try {
            await ctx.accounts.collection.updateOne(
                { name: account.name },
                { $set: { typicalOperations: account.typicalOperations } }
            );
            ctx.reply("Account saved!");
            ctx.scene.leave();
        } catch (err) {
            console.error(err);
            ctx.reply(
                "Something went wrong when saving the account...\nYou can still retry with /done or go /back."
            );
        }
    } else {
        ctx.scene.leave();
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
    let state = ctx.scene.session.state as State;
    state.account = account;
    let builder = [
        "What do you want to do on this account?",
        "- edit /name;",
        "- edit /balance;",
        "- set the /typicalexpenses;",
        "- /delete it.",
        "If your are done, you can go /back.",
    ];
    ctx.reply(builder.join("\n"));
    return;
}

function parseTypicalOp(ctx: myContext) {
    let builder: string[] = [];
    let state = ctx.scene.session.state as State;
    let account = state.account;

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
                builder.push(`- ${op.name}, ${op.value.toFixed(2)}`);
            });
        } else {
            builder.push(`${valueStr.join()} doesn't parse as a number.`);
        }
    }
    ctx.reply(builder.join("\n"));
}

scene.on("text", async (ctx) => {
    let state = ctx.scene.session.state as State;
    let edit: any = undefined;
    if (!state.account) {
        selectAccount(ctx);
        return;
    } else if (state.currentAction == Action.Name) {
        edit = { $set: { name: ctx.message.text } };
    } else if (state.currentAction == Action.Balance) {
        let value = parseFloat(ctx.message.text);
        if (isNaN(value)) {
            ctx.reply(`${value} doesn't parse as a number.`);
        } else {
            edit = { $set: { balance: value } };
        }
    } else if (state.currentAction == Action.Typical) {
        parseTypicalOp(ctx);
        return;
    }

    if (edit) {
        let result = await ctx.accounts.collection.updateOne({ name: state.account.name }, edit);
        if (result.result.ok) {
            ctx.reply("Account edited!");
        } else {
            ctx.reply("Something went wrong while saving.");
        }
    }
    ctx.scene.leave();
});
