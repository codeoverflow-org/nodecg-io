let socket: SocketIOClient.Socket, _config: {token: string, accountId: string};

import * as io from 'socket.io-client';
import { exception } from 'console';

export class StreamElements {
    constructor(config: {token: string, accountId: string}) {
        _config = config;
    }
    connect() {
        socket = io.connect('https://realtime.streamelements.com', {transports: ['websocket']})
    }
    onRegister(handler: () => void) {
        socket.on('connect',handler);
    }
    onDisconnect(handler: () => void) {
        socket.on('disconnect',handler);
    }
    onAuthenticated(handler: () => void) {
        socket.on('authenticated',handler);
    }
    close() {
        socket.close();
    }

    static async test(config: {token: string, accountId: string}){
        const testSocket = io('https://realtime.streamelements.com', {transports: ['websocket']});
        testSocket.on("connect",() => {
            testSocket.emit('authenticate', {
                method: 'jwt',
                token: config.token
            });
        })
        testSocket.on('authenticated',() => {
            testSocket.disconnect();
            return;
        })
        testSocket.on('connect_error', () => {
            throw exception();
        });
    }

}
