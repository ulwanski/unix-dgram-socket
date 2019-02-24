import 'mocha';
import 'expect';
import 'rewire';
import * as sinon from 'sinon';
import * as expect from 'expect';
import rewire = require("rewire");
import * as UnixDgramSocket from "../src/UnixDgramSocket";

describe("UnixDgramSocket constructor", () => {
    it('should create socket instance', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: sinon.spy(),
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        const socket = new SocketComponent.UnixDgramSocket();
        expect(socketLib.socket.calledOnce).toBeTruthy();
    });

    it('should throw exception when socket return error', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => -1,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        expect(() => {
            const socket = new SocketComponent.UnixDgramSocket();
        }).toThrow();
    });

    it('should throw \'Unknown error\' when socket return unknown error code', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => -255,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        expect(() => {
            const socket = new SocketComponent.UnixDgramSocket();
        }).toThrow('Unknown error');
    });

    it('should throw \'Permission denied\' when socket return error code -13', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => -13,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        expect(() => {
            const socket = new SocketComponent.UnixDgramSocket();
        }).toThrow('Permission denied');
    });
});

describe("UnixDgramSocket method", () => {
    it('bind should internally call for socket bind method', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const fsLib = {
            existsSync: () => false,
            statSync: () => {
                return {
                    isSocket: () => false
                };
            },
            unlinkSync: () => false,
            realpathSync: (path: string) => path,
        };

        const socketLib = {
            socket: () => 1,
            bind: sinon.spy(),
        };

        RewiredUnixDgramSocket.__set__('fs', fsLib);
        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        const socket = new SocketComponent.UnixDgramSocket();
        socket.bind('/tmp/foo/socket.sock');

        expect(socketLib.bind.calledOnce).toBeTruthy();
    });

    it('close should internally call for socket close method', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            close: sinon.spy(),
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        const socket = new SocketComponent.UnixDgramSocket();
        socket.close();

        expect(socketLib.close.calledOnce).toBeTruthy();
    });

    it('connect should internally call for socket connect method', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            connect: sinon.spy(),
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        const socket = new SocketComponent.UnixDgramSocket();
        socket.connect('/tmp/foo/socket.sock');

        expect(socketLib.connect.calledOnce).toBeTruthy();
    });

    it('send should internally call for socket sendTo method if socketPath is defined', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            sendto: sinon.spy(),
            send: sinon.spy(),
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        const socket = new SocketComponent.UnixDgramSocket();
        socket.send("foo-data", "/tmp/foo/socket.sock");

        expect(socketLib.sendto.calledOnce).toBeTruthy();
        expect(socketLib.send.calledOnce).toBeFalsy();
    });

    it('send should internally call for socket send method if socketPath is undefined', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            sendto: sinon.spy(),
            send: sinon.spy(),
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;

        const socket = new SocketComponent.UnixDgramSocket();
        socket.send("foo-data");

        expect(socketLib.send.calledOnce).toBeTruthy();
        expect(socketLib.sendto.calledOnce).toBeFalsy();
    });

    it('connect should throw exception when socket.connect return error', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            connect: () => -1,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        expect(() => {
            socket.connect('/tmp/foo/socket.sock');
        }).toThrow();
    });

    it('close should throw exception when socket.close return error', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            close: () => -1,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        expect(() => {
            socket.close();
        }).toThrow();
    });

    it('send should throw exception when socket.send return error', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            send: () => -1,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        expect(() => {
            socket.send("example-data");
        }).toThrow();
    });

    it('send should throw exception when socket.sendto return error', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            sendto: () => -1,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        expect(() => {
            socket.send("example-data", '/tmp/foo/socket.sock');
        }).toThrow();
    });

    it('bind should throw exception when socket.bind return error', () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const socketLib = {
            socket: () => 1,
            bind: () => -1,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        expect(() => {
            socket.bind('/tmp/foo/socket.sock');
        }).toThrow();
    });
});

describe("UnixDgramSocket method cleanupSocketFile", () => {
    it("should check if socket path exists", () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const statSpy = sinon.spy();
        const fsLib = {
            existsSync: () => {
                statSpy();
                return false;
            },
            statSync: () => {
                return {
                    isSocket: () => false
                };
            },
            unlinkSync: () => false,
            realpathSync: (path: string) => path,
        };
        const socketLib = {
            socket: () => 1,
            bind: () => null,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        RewiredUnixDgramSocket.__set__('fs', fsLib);

        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        socket.bind("/tmp/foo/socket.sock");

        expect(statSpy.calledOnce).toBeTruthy();
    });

    it("should call for stat on file if it exists", () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const statSpy = sinon.spy();
        const fsLib = {
            existsSync: () => true,
            statSync: () => {
                statSpy();
                return {
                    isSocket: () => false
                };
            },
            unlinkSync: () => false,
            realpathSync: (path: string) => path,
        };
        const socketLib = {
            socket: () => 1,
            bind: () => null,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        RewiredUnixDgramSocket.__set__('fs', fsLib);

        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        socket.bind("/tmp/foo/socket.sock");

        expect(statSpy.calledOnce).toBeTruthy();
    });

    it("should not call for stat on file if it not exists", () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const statSpy = sinon.spy();
        const fsLib = {
            existsSync: () => false,
            statSync: () => {
                statSpy();
                return {
                    isSocket: () => false
                };
            },
            unlinkSync: () => false,
            realpathSync: (path: string) => path,
        };
        const socketLib = {
            socket: () => 1,
            bind: () => null,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        RewiredUnixDgramSocket.__set__('fs', fsLib);

        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        socket.bind("/tmp/foo/socket.sock");

        expect(statSpy.calledOnce).toBeFalsy();
    });

    it("should delete file if exists and is socket", () => {
        const RewiredUnixDgramSocket = rewire("../src/UnixDgramSocket");
        const statSpy = sinon.spy();
        const fsLib = {
            existsSync: () => true,
            statSync: () => {
                return {
                    isSocket: () => true
                };
            },
            unlinkSync: () => {
                statSpy();
            },
            realpathSync: (path: string) => path,
        };
        const socketLib = {
            socket: () => 1,
            bind: () => null,
        };

        RewiredUnixDgramSocket.__set__('lib', socketLib);
        RewiredUnixDgramSocket.__set__('fs', fsLib);

        const SocketComponent: typeof UnixDgramSocket & typeof RewiredUnixDgramSocket = <any> RewiredUnixDgramSocket;
        const socket = new SocketComponent.UnixDgramSocket();

        socket.bind("/tmp/foo/socket.sock");

        expect(statSpy.calledOnce).toBeTruthy();
    });
});
