import * as mongodb from "mongodb";

export default interface Crate {
    _id: mongodb.ObjectID;
    name: string;
    unitPrice: number;
    owner: {
        name: string;
        id: number;
    };
    consumers: number[];
}

export enum CrateOperationType {
    Take = 1,
    PutBack,
    Settle,
}

export interface CrateOperation {
    _id: mongodb.ObjectID;
    type: CrateOperationType;
    crateId: mongodb.ObjectID;
}

export class Crates {
    public collection: mongodb.Collection<Crate>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Crate>("crates");
        // this.collection.createIndex({ name: 1 }, { unique: true });
        this.collection.createIndex({ name: "text" });
    }
}
