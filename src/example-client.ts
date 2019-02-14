/* tslint:disable:no-console */

import {UnixDgramSocket} from "./UnixDgramSocket";

const socket = new UnixDgramSocket();

socket.on('error', (error: any) => {
    console.log(error);
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

socket.connect("@/tmp/socket_test1.sock");
socket.send("example string");

socket.bind("@/tmp/socket_test3.sock");
socket.send("f", "@/tmp/socket_test1.sock");

socket.bind("/tmp/socket_sock");
socket.send("Marek", "@/tmp/socket_test1.sock");

socket.close();
