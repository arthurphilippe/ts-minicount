import Account from "./../Account";
import myContext from "../Context";
import * as telegraf from "telegraf";

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

// scene.command("typicalexpenses", (ctx) => {
//     let state = ctx.scene.session.state as State;
//     if (!state.account) {
//         ctx.reply("You should select an account first.");
//         ctx.scene.reenter();
//     } else {
//         state.currentAction = Action.Typical;
//         ctx.reply("What's the account balance?");
//     }
// });

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
        // "- edit /typicalexpenses;",
        "- /delete it.",
        "If your are done, you can go /back.",
    ];
    ctx.reply(builder.join("\n"));
    return;
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
        if (value === undefined || isNaN(value)) {
            ctx.reply(`${value} doesn't parse as a number.`);
        } else {
            edit = { $set: { balance: value } };
        }
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
