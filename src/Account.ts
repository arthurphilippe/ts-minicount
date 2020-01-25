import * as mongodb from "mongodb";

export default interface Account {
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
