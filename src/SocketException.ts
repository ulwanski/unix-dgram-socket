import {errors} from "./UnixSocketErrors";

export class SocketException extends Error {

    protected code: string;
    protected syscall: string;
    protected errorNumber: number;

    public constructor(errorNumber: number, syscall?: string) {
        errorNumber = Math.abs(errorNumber);
        super((errors[errorNumber]) ? errors[errorNumber].desc : 'Unknown error');

        this.name = 'Socket error';
        this.code = (errors[errorNumber]) ? errors[errorNumber].code : undefined;
        this.errorNumber = errorNumber;
        this.syscall = syscall;
    }
}
