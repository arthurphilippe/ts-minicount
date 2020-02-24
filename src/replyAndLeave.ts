import myContext from "./Context";
export function replyAndLeave(ctx: myContext, err: Error) {
    if (err) ctx.reply(err.message);
    ctx.scene.leave();
}
