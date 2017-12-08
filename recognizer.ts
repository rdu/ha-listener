import {HotwordDetector} from "./detector";

const net = require("net");

const server = net.createServer();
server.on("connection", handleConnection);

server.listen(4242, function ()
{
    console.log("server listening to %j", server.address());
});

function handleConnection(conn)
{
    const remoteAddress = conn.remoteAddress + ":" + conn.remotePort;
    console.log("new client connection from %s", remoteAddress);

    conn.on("data", onConnData);
    conn.once("close", onConnClose);
    conn.on("error", onConnError);

    const detector = new HotwordDetector();

    detector.on("result", function (result)
    {
        // console.log("on result", result);
    });

    detector.detect(conn);

    function onConnData(d)
    {
        detector.onRawData(d);
    }

    function onConnClose()
    {
        console.log("connection from %s closed", remoteAddress);
        detector.destroy();
    }

    function onConnError(err)
    {
        console.log("Connection %s error: %s", remoteAddress, err.message);
        detector.destroy();
    }
}