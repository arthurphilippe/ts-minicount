import * as mongodb from "mongodb";

export default interface Account {
    _id: mongodb.ObjectID;
    referenceId: number;
    name: string;
    balance: number;
    typicalOperations?: {
        name: string;
        value: number;
    }[];
}

export function isAccount(x: any): x is Account {
    return x.name !== undefined && x.balance !== undefined && x.referenceId !== undefined;
}

export function toSimpleString(acc: Account): string {
    return `- ${acc.name}: ${acc.balance}`;
}

export async function listAllByRef(accs: Accounts, ref: number) {
    let builder: string[] = [];

    let result = await accs.collection
        .find({ referenceId: ref }, { projection: { balance: 1, name: 1 } })
        .toArray();

    if (!result.length) builder.push(`*No accounts were found.*`);
    else builder.push(`Here are your accounts:`);

    result.forEach((elem) => {
        builder.push(toSimpleString(elem));
    });

    return builder.join("\n");
}

export class Accounts {
    public collection: mongodb.Collection<Account>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Account>("accounts");
        this.collection.createIndex({ name: 1 }, { unique: true });
    }
}
