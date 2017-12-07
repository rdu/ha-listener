import {HotwordDetector} from "./detector";

var net = require('net');

var server = net.createServer();
server.on('connection', handleConnection);

server.listen(4242, function ()
{
    console.log('server listening to %j', server.address());
});

function handleConnection(conn)
{
    var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    console.log('new client connection from %s', remoteAddress);

    conn.on('data', onConnData);
    conn.once('close', onConnClose);
    conn.on('error', onConnError);

    let detector = new HotwordDetector();
    detector.detect(conn);

    function onConnData(d)
    {
    }

    function onConnClose()
    {
        console.log('connection from %s closed', remoteAddress);
        detector.finishRecognizing();
    }

    function onConnError(err)
    {
        console.log('Connection %s error: %s', remoteAddress, err.message);
        detector.finishRecognizing();
    }
}