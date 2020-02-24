import * as mongodb from "mongodb";

export default interface Task {
    _id: mongodb.ObjectID;
    referenceId: number;
    name: string;
    nextOn: Date;
    // grace_minutes: number;
}

export function isTask(x: any): x is Task {
    return (
        x.name !== undefined &&
        x.at !== undefined &&
        x.at.minutes !== undefined &&
        x.at.hours !== undefined &&
        x.referenceId !== undefined
    );
}

export enum closureType {
    Completed = "Completed",
    Canceled = "Canceled",
}

export interface Occurence {
    _id: mongodb.ObjectID;
    referenceId: number;
    task: mongodb.ObjectID | Task;
    on: Date;
    closed?: Date;
    closureKind?: closureType;
}

export function isOccurence(x: any): x is Occurence {
    return x.task !== undefined && x.on !== undefined && x.referenceId !== undefined;
}

export function toSimpleString(task: Task): string {
    return `- ${task.name} at ${task.nextOn.getHours()}:${task.nextOn.getMinutes()}`;
}

export class Tasks {
    public collection: mongodb.Collection<Task>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Task>("tasks");
    }
}

export class Occurences {
    public collection: mongodb.Collection<Occurence>;
    constructor(dbclient: mongodb.Db) {
        this.collection = dbclient.collection<Occurence>("occurences");
    }
}
