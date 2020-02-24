import myContext from "../Context";
import { ObjectID, UpdateQuery } from "mongodb";
import Task, { Occurence, closureType } from "./Task";
import * as telegraf from "telegraf_acp_fork";

interface occurenceOp {
    type: string;
    buttons: Array<any>;
    mutation: UpdateQuery<Occurence>;
    messagePrefix: string;
}

async function completeTasks(ctx: myContext, operationStr: string, idStr: string) {
    let id = new ObjectID(idStr);

    const occurenceOperations: occurenceOp[] = [
        {
            type: "undo",
            buttons: [
                telegraf.Markup.callbackButton("✅", `task;complete;${id.toHexString()}`),
                telegraf.Markup.callbackButton("❌", `task;cancel;${id.toHexString()}`),
            ],
            mutation: {
                $unset: { closed: "", closureKind: "" },
            },
            messagePrefix: "🔔",
        },
        {
            type: "complete",
            buttons: [
                telegraf.Markup.callbackButton("🔙✅", `task;undo;${id.toHexString()}`),
                telegraf.Markup.callbackButton("❌", `task;cancel;${id.toHexString()}`),
            ],
            mutation: {
                $set: { closed: new Date(), closureKind: closureType.Completed },
            },
            messagePrefix: "✅",
        },
        {
            type: "cancel",
            buttons: [
                telegraf.Markup.callbackButton("✅", `task;complete;${id.toHexString()}`),
                telegraf.Markup.callbackButton("🔙❌", `task;undo;${id.toHexString()}`),
            ],
            mutation: {
                $set: { closed: new Date(), closureKind: closureType.Canceled },
            },
            messagePrefix: "❌",
        },
    ];

    let activeOp = occurenceOperations.find((value) => {
        if (value.type == operationStr) return true;
    });

    let result = await ctx.occurences.collection.findOneAndUpdate({ _id: id }, activeOp.mutation);

    if (result.ok) {
        console.log(result);
        result.value.task = await ctx.tasks.collection.findOne({
            _id: result.value.task as ObjectID,
        });
        if (!result.value.task) {
            result.value.task = { name: "deleted task" } as Task;
        }
        ctx.editMessageText(
            `${activeOp.messagePrefix} ${(result.value.task as Task).name}`,
            telegraf.Markup.inlineKeyboard(activeOp.buttons).extra()
        );
    }
}

export function cb(ctx: myContext, next: Function) {
    if (ctx.splitCb.length < 2 || ctx.splitCb[0] != "task") {
        next();
    } else {
        if (
            (ctx.splitCb[1] == "complete" ||
                ctx.splitCb[1] == "cancel" ||
                ctx.splitCb[1] == "undo") &&
            ctx.splitCb.length >= 3
        ) {
            completeTasks(ctx, ctx.splitCb[1], ctx.splitCb[2]);
        }
    }
}
