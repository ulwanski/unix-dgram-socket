import * as fs from "fs";
import {EventEmitter} from "events";
import {errors} from "./UnixSocketErrors";

/* tslint:disable:no-var-requires */
const lib = require('../build/Release/unix_dgram');

export class UnixDgramSocket extends EventEmitter {
    public static readonly payloadEncoding = 'utf8';
    protected fd: any;
    protected connected: any;

    public constructor() {
        super();

        this.fd = lib.socket(lib.AF_UNIX, lib.SOCK_DGRAM, 0, (size: number, data: Buffer, sockPath: string | null) => {
            this.emit('message', data.toString(UnixDgramSocket.payloadEncoding), { size, path: sockPath });
        }, () => {
            this.emit('writable');
        });

        if (this.fd < 0) {
            throw new this.errnoException(this.fd, 'socket');
        }
    }

    public bind(socketPath: string): void {
        const err: any = lib.bind(this.fd, this.cleanupSocketFile(socketPath));
        if (err < 0) {
            this.emit('error', this.errnoException(err, 'bind'));
        } else {
            this.emit('listening', socketPath);
        }
    }

    public send(data: Buffer | string, socketPath?: string): void {
        let result: any;

        if (typeof data === 'string') {
            data = Buffer.from(data, UnixDgramSocket.payloadEncoding);
        }

        if (socketPath) {
            result = lib.sendto(this.fd, data, 0, data.length, socketPath);
        } else {
            if (!this.connected) {
                this.emit('error', new Error('Socket is not connected'));
                return;
            }
            result = lib.send(this.fd, data);
        }

        if (result < 0) {
            this.emit('error', this.errnoException(result, 'send'));
        } else if (result === 1) {
            this.emit('congestion', data);
        }
    }

    public close() {
        const err: any = lib.close(this.fd);
        if (err < 0) {
            throw new this.errnoException(err, 'close');
        }
        this.fd = -1;
    }

    /*
     The connect() system call connects the socket referred to by the file
     descriptor sockfd to the address specified by addr. If the socket sockfd
     is of type SOCK_DGRAM, then addr is the address to which datagrams
     are sent by default, and the only address from which datagrams are received.
     If the socket is of type SOCK_STREAM or SOCK_SEQPACKET, this call attempts
     to make a connection to the socket that is bound to the address specified by addr.

     Generally, connection-based protocol sockets may successfully
     connect() only once; connectionless protocol sockets may use
     connect() multiple times to change their association.
     Connectionless sockets may dissolve the association by connecting to an address with
     the sa_family member of sockaddr set to AF_UNSPEC (supported on Linux
     since kernel 2.2).
     */
    public connect(socketPath: string) {
        const err: any = lib.connect(this.fd, socketPath);
        if (err < 0) {
            this.emit('error', this.errnoException(err, 'connect'));
        } else {
            this.connected = true;
            this.emit('connect', socketPath);
        }
    }

    protected errnoException(errorNo: number, syscall: string): void {
        errorNo = Math.abs(errorNo);
        const error: any = new Error(`${syscall}: ${errors[errorNo].desc}`);
        error.code = errors[errorNo].code;
        error.errno = errorNo;
        error.syscall = syscall;

        return error;
    }

    protected cleanupSocketFile(socketPath: string): string {
        if (fs.existsSync(socketPath)) {
            const stat: fs.Stats = fs.statSync(socketPath);

            if (stat.isSocket()) {
                fs.unlinkSync(fs.realpathSync(socketPath));
            }
        }

        return socketPath;
    }
}
