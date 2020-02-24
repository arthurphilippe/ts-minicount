import myContext from "../Context";
import * as input from "../input";

export function askForAccountName(ctx: myContext, accs_names: string[]): Promise<string> {
    return input.stringMca(ctx, accs_names, false, false, {
        question: "Do tell, on what account do you wish to add an operation?",
        failure: "I'm not sure which account you are trying to access...",
        success: "",
    });
}
