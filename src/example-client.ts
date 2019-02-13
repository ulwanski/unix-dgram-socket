/* tslint:disable:no-console */

import {UnixDgramSocket} from "./UnixDgramSocket";

const socket = new UnixDgramSocket();

socket.on('error', (error: any) => {
    console.log(error);
});

socket.on('writable', () => {
    console.log('writable');
});

socket.on('message', (message: any) => {
    console.log(message);
});

socket.on('connect', (path: string) => {
    console.log('connect', path);
});

socket.on('listening', (path: string) => {
    console.log('listening', path);
});

// socket.connect("\0/tmp/socket_test1.sock");

socket.send("example string", "\0/tmp/socket_test1.sock");

socket.bind("/tmp/socket_test1.sock");

socket.send("f", "\0/tmp/socket_test1.sock");
socket.send("Marek", "\0/tmp/socket_test1.sock");
socket.send("abc", "\0/tmp/socket_test1.sock");

socket.close();
