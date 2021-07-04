/* tslint:disable:no-console */

import {UnixDgramSocket} from "./UnixDgramSocket";

const socket = new UnixDgramSocket();

socket.on('error', (error: any) => {
    console.log(error);
});

socket.on('writable', () => {
    console.log('writable');
});

socket.on('message', (message: Buffer, info: any) => {
    console.log(message.toString(UnixDgramSocket.payloadEncoding));
    
    console.log(info);
});

socket.on('connect', (path: string) => {
    console.log('connect', path);
});

socket.on('listening', (path: string) => {
    console.log('listening', path);
});

socket.on('congestion', (buf: any) => {
    console.log('congestion: ', buf);
});

socket.bind("\0/tmp/socket_test1.sock");
