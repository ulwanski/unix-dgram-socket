import 'mocha';
import 'expect';
import * as sinon from 'sinon';
import * as expect from 'expect';
import {UnixDgramSocket} from "../src/UnixDgramSocket";

const socket: UnixDgramSocket = new UnixDgramSocket();
socket.bind('@/tmp/node/tests/unix-dgram-socket/func');
const error = sinon.spy();

describe("Message sending tests", () => {
    it('should receive message and close socket', (done) => {
        socket.on('message', (data: Buffer) => {
            socket.close();
            expect(data.toString()).toBe('foo123');
            expect(error.notCalled).toBeTruthy();
            done();
        });

        const result = socket.send('foo123', '@/tmp/node/tests/unix-dgram-socket/func');
        expect(result).toBeTruthy();
    });
});
