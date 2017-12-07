import {Verify} from "crypto";
import {clearTimeout} from "timers";

const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient({
    keyFilename: './key.json'
});

enum DetectorStates
{
    LISTENING,
    VERIFYING,
    VERIFIED
}

export class HotwordDetector
{
    state: DetectorStates;
    models: any = null;
    detector: any = null;
    hotwordBuffer: Buffer = Buffer.from([]);
    commandBuffer: Buffer = Buffer.from([]);
    commandStream = null;
    silenceTimer = null;

    constructor()
    {
        console.log("construct hotword decoder");
        let $this = this;
        this.state = DetectorStates.LISTENING;
        this.models = HotwordDetector.createModels();

        $this.detector = new Detector({
            resource: "node_modules/snowboy/resources/common.res",
            models: this.models,
            audioGain: 4.0
        });

        $this.detector.on('silence', function () { $this.onSilence(); });
        $this.detector.on('hotword', function (index, hotword, buffer) { $this.onHotWord(index, hotword, buffer) });
        $this.detector.on('sound', function (buffer) { $this.onSound(buffer) });
    }

    static createModels()
    {
        var models = new Models();
        models.add({
            file: 'models/rdu_hallo-uschi_1.pmdl',
            sensitivity: '0.7',
            hotwords: 'hallo uschi'
        });
        return models;
    }

    detect(stream)
    {
        stream.pipe(this.detector);
    }

    private verifyHotword(hotword, index, buffer)
    {
        let $this = this;
        this.state = DetectorStates.VERIFYING;
        console.log("verifying hotword", hotword, index);

        speechClient
            .recognize({
                config: {
                    encoding: "LINEAR16",
                    sampleRateHertz: 32000,
                    languageCode: "de-DE",
                },
                audio: {
                    content: buffer.toString('base64')
                }
            })
            .then(data =>
            {
                const response = data[0];
                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                if (transcription.toLowerCase() == hotword.toLowerCase())
                {
                    console.log("verified hotword", hotword);
                    $this.state = DetectorStates.VERIFIED;
                }
                else
                {
                    console.log("error verify hotword", hotword, "found", transcription);
                    console.log(response);
                    $this.finishRecognizing();
                }
            })
            .catch(err =>
            {
                console.error('ERROR:', err);
            });
    }

    private onSound(buffer)
    {
        let $this = this;
        console.log("on sound", this.state);
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
        if (this.state == DetectorStates.LISTENING)
        {
            this.hotwordBuffer = Buffer.concat([this.hotwordBuffer, buffer]);
        }
        if (this.state == DetectorStates.VERIFYING || this.state == DetectorStates.VERIFIED)
        {
            this.commandBuffer = Buffer.concat([this.commandBuffer, buffer]);
        }
        if (this.state == DetectorStates.VERIFIED)
        {
            if (this.commandStream == null)
            {
                this.commandStream = speechClient
                    .streamingRecognize({
                        config: {
                            encoding: "LINEAR16",
                            sampleRateHertz: 32000,
                            languageCode: "de-DE",
                        },
                        interimResults: false
                    })
                    .on('error', console.error)
                    .on('data', data =>
                    {
                        console.log(
                            `Transcription: ${data.results[0].alternatives[0].transcript}`
                        );
                    });
            }
            $this.commandStream.write(this.commandBuffer);
            $this.commandBuffer = Buffer.from([]);
        }
    }

    private onHotWord(index, hotword, buffer)
    {
        console.log("on hotword", index, hotword);
        if (this.state == DetectorStates.LISTENING)
        {
            this.hotwordBuffer = Buffer.concat([this.hotwordBuffer, buffer]);
            this.verifyHotword(hotword, index, this.hotwordBuffer);
            this.hotwordBuffer = this.hotwordBuffer = Buffer.from([]);
        }
    }

    public finishRecognizing()
    {
        this.state = DetectorStates.LISTENING;
        if (this.commandStream != null)
        {
            this.commandStream.end();
        }
        this.hotwordBuffer = Buffer.from([]);
        this.commandBuffer = Buffer.from([]);
        this.commandStream = null;
        if (this.silenceTimer != null)
        {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
    }

    private onSilence()
    {
        let $this = this;
        console.log("on silence", this.state);
        if (this.state == DetectorStates.LISTENING)
        {
            this.hotwordBuffer = Buffer.from([]);
        }
        if (this.state == DetectorStates.VERIFIED || this.state == DetectorStates.VERIFYING)
        {
            if (this.silenceTimer == null)
            {
                this.silenceTimer = setTimeout(function ()
                {
                    $this.finishRecognizing();
                }, 500);
            }
        }
    }
}
