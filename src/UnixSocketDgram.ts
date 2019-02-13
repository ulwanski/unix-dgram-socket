import * as fs from "fs";
import {EventEmitter} from "events";
import {SocketType} from "dgram";
import {UnixDgramSocket} from "./UnixDgramSocket";

export interface IpAddress {
    readonly family: SocketType | 'unix_dgram';
    readonly address: string;
    readonly path?: string;
    readonly port: number;
}

export interface DgramMessage {
    readonly data: Buffer;
    readonly sender: IpAddress;
    readonly size: number;
}

export interface MessageInfo {
    readonly size: number;
    readonly port?: number;
    readonly address?: string;
    readonly path?: string;
    readonly family: SocketType;
}

export type OnMessageCallback = (message: DgramMessage) => void;

/**
 * Class UnixSocketDgram provides an implementation of Unix DGRAM type sockets.
 */
export class UnixSocketDgram extends EventEmitter {

    public static readonly payloadEncoding = 'utf8';

    // The unixDgram.Socket object is an EventEmitter that encapsulates the datagram functionality.
    protected socket: UnixDgramSocket;

    // @TODO: Opened path should be stored in bind socket
    private path: string;

    public constructor(onMessage?: OnMessageCallback) {
        super();

        // Message handler function is called for every incoming packet
        let messageHandler: OnMessageCallback;

        // onMessage parameter is call if user implemented it, "message" event is always emitted
        if (typeof onMessage === 'function') {
            messageHandler = (udpMessage: DgramMessage) => {
                onMessage(udpMessage);
                this.emit('message', udpMessage);
            };
        } else {
            messageHandler = (udpMessage: DgramMessage) => {
                this.emit('message', udpMessage);
            };
        }

        // Create socket object
        this.socket = new UnixDgramSocket();

        // The 'listening' event is emitted whenever a socket begins listening for datagram messages.
        this.socket.on('listening', (path: string) => {
            this.emit('listening', path);
        });

        // The 'close' event is emitted after a socket is closed with close().
        // Once triggered, no new 'message' events will be emitted on this socket.
        this.socket.on('close', () => {
            this.emit('close');
        });

        // The 'error' event is emitted whenever any error occurs.
        // The event handler function is passed a single Error object.
        this.socket.on('error', (error: Error) => {
            this.emit('error', error);
        });

        this.socket.on('message', (data: Buffer, info: any) => {
            messageHandler({
                data: JSON.parse(data.toString(UnixDgramSocket.payloadEncoding)),
                sender: {
                    address: undefined,
                    port: undefined,
                    family: 'unix_dgram',
                    path: info.path,
                },
                size: data.length,
            });
        });
    }

    // Close the underlying socket and stop listening for data on it.
    public closeSocket(): void {
        this.socket.close();
    }

    public send(message: any, socketPath: string, callback?: (error) => void): void {
        const payload = new Buffer(JSON.stringify(message));
        this.socket.send(payload, socketPath);
    }

    public openSocket(path: string): void {
        this.path = path;
        this.socket.bind(this.cleanupSocketFile(path));
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
