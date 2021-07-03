import 'mocha';
import 'expect';
import * as sinon from 'sinon';
import * as expect from 'expect';
import {Done} from "mocha";
import {UnixDgramSocket} from "../src/UnixDgramSocket";

function runTest(socketPath: string, testData: string) {
    return (done: Done) => {
        const error = sinon.spy();
        const socket: UnixDgramSocket = new UnixDgramSocket();
        socket.bind(socketPath);

        socket.on('message', (data: Buffer) => {
            socket.close();
            expect(data.toString()).toBe(testData);
            expect(error.notCalled).toBeTruthy();
            done();
        });

        socket.on("error", error);

        const result = socket.send(testData, socketPath);
        expect(result).toBeTruthy();
    };
}

describe("Socket", () => {
    it('should transmit through unix filesystem socket', runTest('/tmp/unix-dgram-sock-test.sock', 'foo123#'));
    it('should transmit through abstract unix socket', runTest('@/tmp/node/tests/unix-dgram-socket', 'foo123#'));
});
