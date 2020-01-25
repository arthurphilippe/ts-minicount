import * as mongodb from "mongodb";

// TODO: link account with user or chat
export default interface Account {
    _id: mongodb.ObjectID;
    name: string;
    balance: number;
    typicalOperations?: {
        name: string;
        value: number;
    }[];
}

export class Accounts {
    public collection: mongodb.Collection<Account>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Account>("accounts");
    }
}
