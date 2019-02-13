import {UnixSocketDgram, OnMessageCallback} from "./UnixSocketDgram";
import nanoId = require("nanoid");

/**
 * Class IpcAbstractPipe provides an implementation of simple node IPC system based on unix DGRAM abstract socket.
 */
export class IpcAbstractPipe extends UnixSocketDgram {

    protected static getAbstractSocketPath(socketId?: string): string {
        const basePath = '/tmp/dbus-node/.ipc';
        const randomName = (socketId) ? socketId : nanoId();

        return `\0${basePath}/${randomName}.sock`;
    }

    public constructor(pipeId?: string, onMessage?: OnMessageCallback) {
        super(onMessage);

        this.openSocket(IpcAbstractPipe.getAbstractSocketPath(pipeId));
    }

    public send(message: any, pipeId: string, callback?: (error) => void): void {
        const socketPath = IpcAbstractPipe.getAbstractSocketPath(pipeId);
        const payload = new Buffer(JSON.stringify(message));
        this.socket.send(payload, socketPath);
    }
}
