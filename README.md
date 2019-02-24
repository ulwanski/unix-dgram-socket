# unix-dgram-socket
[![Maintainability](https://api.codeclimate.com/v1/badges/dbc4719bb948227082c5/maintainability)](https://codeclimate.com/github/ulwanski/unix-dgram-socket/maintainability) 
[![Test Coverage](https://api.codeclimate.com/v1/badges/dbc4719bb948227082c5/test_coverage)](https://codeclimate.com/github/ulwanski/unix-dgram-socket/test_coverage) 
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d3c2d8318a5f4a91b092bad74a2173fc)](https://www.codacy.com/app/ulwanski/unix-dgram-socket?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ulwanski/unix-dgram-socket&amp;utm_campaign=Badge_Grade) 

![](https://img.shields.io/github/issues-raw/ulwanski/unix-dgram-socket.svg?style=flat)
![](https://img.shields.io/snyk/vulnerabilities/npm/unix-dgram-socket.svg?style=flat-square)

Connection-less, reliable unix datagram socket implementation with abstract namespace support for local interprocess communication in Node.JS application.
UNIX domain sockets can be either unnamed, or bound to a filesystem pathname (marked as being of type socket).
Linux also supports an abstract namespace which is independent of the filesystem.

## Installation
```bash
npm i unix-dgram-socket --save
```
Package C++ addons will be compiled during installation.

## Examples
#### Open socket
```typescript
import {UnixDgramSocket} from "unix-dgram-socket";

const socket = new UnixDgramSocket();

// Call on error
socket.on('error', (error: any) => {
    console.log(error);
});

// Call when new message is received
socket.on('message', (message: Buffer, info: any) => {
    console.log(message.toString(UnixDgramSocket.payloadEncoding));
    console.log(info);
});

// Call when socket is bind to path
socket.on('listening', (path: string) => {
    console.log(`socket listening on path: ${path}`);
});

// Bind socket to filesystem path
socket.bind("/tmp/socket1.sock");
```

#### Sending messages
```typescript
import {UnixDgramSocket} from "unix-dgram-socket";

const socket = new UnixDgramSocket();

// Call on error
socket.on('error', (error: any) => {
    console.log(error);
});

// Call when new message is received
socket.on('message', (message: Buffer, info: any) => {
    console.log(message.toString(UnixDgramSocket.payloadEncoding));
    console.log(info);
});

// Call on successful connect
socket.on('connect', (path: string) => {
    console.log(`socket connected to path: ${path}`);
});

// Call when socket is bind to path
socket.on('listening', (path: string) => {
    console.log(`socket listening on path: ${path}`);
});

socket.send("Special inter-process delivery!", "/tmp/socket1.sock");

// Dgram socket is connection-less so call connect only set default destination path and can be called many times
socket.connect("/tmp/socket1.sock");

// Send can be called without path if 'connect' was called before
socket.send("I will be send to default path, set by connect!");

// CLose socket to prevent further communication
socket.close();
```

#### Operating with abstract namespace path
Abstract namespace path can be passed by starting path string from null byte ('\0') or "@" character.
```typescript
// Bind socket to abstract path
socket.bind("@/abstract/path/socket1.sock");

// Send data to abstract namespace path
socket.send("Special inter-process delivery!", "@/abstract/path/socket1.sock");
```

## Additional information 
#### Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

#### License
[GPL-3.0](https://choosealicense.com/licenses/gpl-3.0/)

#### References
- http://man7.org/linux/man-pages/man7/unix.7.html
- http://man7.org/linux/man-pages/man2/socket.2.html
