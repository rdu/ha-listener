// const record = require('node-record-lpcm16');
// const Detector = require('snowboy').Detector;
// const Models = require('snowboy').Models;
//
// var fs = require('fs');
//
// const models = new Models();
//
// var sending: any = false;
// var timer: any = null;
// var silenceTimer: any = null;
// var globalTimer: any = null;
//
// var stream = fs.createWriteStream('/tmp/xx.wav');
//
// models.add({
//     file: 'models/rdu_hallo-uschi_1.pmdl',
//     sensitivity: '0.7',
//     hotwords: 'hallo uschi'
// });
//
// models.add({
//     file: 'models/rdu_hallo-uschi_2.pmdl',
//     sensitivity: '0.4',
//     hotwords: 'hallo uschi 2'
// });
//
// models.add({
//     file: 'models/rdu_hallo-uschi_3.pmdl',
//     sensitivity: '0.4',
//     hotwords: 'hallo uschi 3'
// });
//
// /*models.add({
//   file: 'resources/sj_ok-uschi_1.pmdl',
//   sensitivity: '0.39',
//   hotwords : 'ok uschi 1'
// });
// */
// models.add({
//     file: 'models/sj_ok-uschi_2.pmdl',
//     sensitivity: '0.4',
//     hotwords: 'ok uschi 2'
// });
// /*
// models.add({
//   file: 'resources/sj_ok-uschi_3.pmdl',
//   sensitivity: '0.5',
//   hotwords : 'ok uschi 3'
// });
//
// */
// models.add({
//     file: 'models/bj_hallo-marshall_1.pmdl',
//     sensitivity: '0.4',
//     hotwords: 'hallo marschall'
// });
//
// models.add({
//     file: 'models/bj_hallo-marshall_2.pmdl',
//     sensitivity: '0.4',
//     hotwords: 'hallo marschall 2'
// });
//
// const detector = new Detector({
//     resource: "node_modules/snowboy/resources/common.res",
//     models: models,
//     audioGain: 4.0
// });
//
// detector.on('silence', function ()
// {
//     if (sending)
//     {
//         console.log('silence');
//         if (silenceTimer == null)
//         {
//             silenceTimer = setTimeout(function ()
//             {
//                 stream.end();
//                 console.log("silence timer ended");
//                 clearTimeout(timer);
//                 clearTimeout(globalTimer);
//                 sending = false;
//             }, 3000);
//         }
//     }
// });
//
// detector.on('sound', function (buffer)
// { // Buffer arguments contains sound that triggered the event, for example, it could be written to a wav stream
//     stream.write(buffer);
//     if (sending)
//     {
//         console.log("sending:", buffer.length);
//         clearTimeout(timer);
//         clearTimeout(silenceTimer);
//         silenceTimer = null;
//         timer = setTimeout(function ()
//         {
//             console.log("timer ended");
//             clearTimeout(silenceTimer);
//             clearTimeout(globalTimer);
//             silenceTimer = null;
//             sending = false;
//         }, 500);
//     }
//     //  console.log('sound');
// });
//
// detector.on('error', function ()
// {
//     console.log('error');
// });
//
// detector.on('hotword', function (index, hotword, buffer)
// { // Buffer arguments contains sound that triggered the event, for example, it could be written to a wav stream
//     console.log('hotword', index, hotword);
//     console.log("hotwort start");
//     sending = true;
//     clearTimeout(globalTimer);
//     globalTimer = setTimeout(function ()
//     {
//         clearTimeout(silenceTimer);
//         clearTimeout(timer);
//         silenceTimer = null;
//         timer = null;
//         sending = false;
//         console.log("global timer ended");
//     }, 8000);
// });
//
// const mic = record.start({
//     threshold: 0.0,
//     device: 'plughw:CARD=Leaf,DEV=0', //plughw:CARD=CameraB409241,DEV=0
//     verbose: false
// });
//
// var Throttle = require('stream-throttle').Throttle;
//
// var readableStream = fs.createReadStream('models/1.wav');
// readableStream.pipe(new Throttle({rate: 32000})).pipe(detector);
//
// // mic.pipe(detector);
