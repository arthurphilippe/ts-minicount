import myContext from "../Context";
export async function getAccountNames(ctx: myContext): Promise<string[]> {
    let cursor = ctx.accounts.collection.find(
        { referenceId: ctx.chat.id },
        { projection: { name: 1 } }
    );
    const accs = await cursor.toArray();
    if (!accs.length)
        throw Error(
            "You need to create an account before trying to access one. You can use /createaccount."
        );
    let accs_names: string[] = [];
    accs.forEach((elem) => {
        accs_names.push(elem.name);
    });
    return accs_names;
}
