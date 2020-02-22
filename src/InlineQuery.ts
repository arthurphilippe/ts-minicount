import myContext from "./Context";
import * as telegraf from "telegraf_acp_fork";
import { InlineQueryResultArticle } from "telegraf/typings/telegram-types";
// import { Crates } from "./Crate";

export default async function(ctx: myContext) {
    let crates = await ctx.crates.collection
        .find({
            $text: { $search: ctx.inlineQuery.query },
            $or: [{ "owner.id": ctx.from.id }, { consumers: ctx.from.id }],
        })
        .toArray();

    let out: InlineQueryResultArticle[] = [];

    crates.forEach((element) => {
        out.push({
            title: element.name,
            type: "article",
            id: element._id.toHexString(),
            input_message_content: { message_text: element.name },
            description: `Each: ¤${element.unitPrice}, brought by: ${element.owner.name}.`,
            reply_markup: telegraf.Markup.inlineKeyboard([
                telegraf.Markup.callbackButton("Take one", `take;${element._id.toHexString()}`),
                telegraf.Markup.callbackButton("Put back one", `put;${element._id.toHexString()}`),
                telegraf.Markup.callbackButton(
                    "See history",
                    `history;${element._id.toHexString()}`
                ),
                telegraf.Markup.callbackButton("Settle", `settle;${element._id.toHexString()}`),
            ]),
        });
    });

    // let answsers = [
    //     {
    //         type: "article",
    //         id: "kappa",
    //         title: "kappa",
    //         description: "...",
    //         input_message_content: {
    //             message_text: "kappa",
    //         },
    //         reply_markup: telegraf.Markup.inlineKeyboard([
    //             telegraf.Markup.callbackButton("Take one", "take id"),
    //             // telegraf.Markup.callbackButton("Put one back", "put id"),
    //             // telegraf.Markup.callbackButton("Settle", "settle id"),
    //             // telegraf.Markup.callbackButton("See history", "history id"),
    //             // telegraf.Markup.urlButton("patate", "arthurphilippe.me"),
    //             //     telegraf.Markup.art
    //         ]),
    //     },
    // ];
    ctx.answerInlineQuery(out);
}
