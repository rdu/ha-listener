const Detector = require("snowboy").Detector;
const Models = require("snowboy").Models;
const speech = require("@google-cloud/speech");
const ee = require("event-emitter");
const speechClient = new speech.SpeechClient({
    keyFilename: "./key.json"
});

enum DetectorStates
{
    LISTENING,
    RECOGNIZING
}

export class HotwordDetector
{
    state: DetectorStates;
    models: any = null;
    detector: any = null;
    stream: any = null;
    sound = false;
    buffer: any = Buffer.from([]);
    currentHotword = null;

    constructor()
    {
        console.log("construct hotword decoder");
        const $this: HotwordDetector = this;
        $this.state = DetectorStates.LISTENING;
        $this.models = HotwordDetector.createModels();

        $this.detector = new Detector({
            resource: "node_modules/snowboy/resources/common.res",
            models: this.models,
            audioGain: 2.0
        });

        $this.detector.on("hotword", function (index, hotword, buffer)
        {
            $this.onHotWord(index, hotword);
        });
        this.startStreaming();
    }

    static createModels()
    {
        const models = new Models();
        models.add({
            file: "models/rdu_hallo-uschi_1.pmdl",
            sensitivity: "0.7",
            hotwords: "hallo uschi"
        });
        return models;
    }

    detect(stream)
    {
        stream.pipe(this.detector);
    }

    public onRawData(buffer)
    {
        if (this.stream !== null)
        {
            let value = 0;
            for (let i = 0; i < buffer.length; i += 2)
            {
                value += Math.abs(buffer.readInt16LE(i));
            }
            const v = value / buffer.length;
            if (v > 30)
            {
                // console.log("audio");
                this.buffer = Buffer.concat([this.buffer, buffer]);
            }
            else
            {
                // console.log("silence");
            }
        }
        if (this.state === DetectorStates.RECOGNIZING)
        {
            if (this.buffer.length > 0)
            {
                this.stream.write(this.buffer);
                this.buffer = Buffer.from([]);
            }
        }
    }

    private onHotWord(index, hotword)
    {
        console.log("on hotword", index, hotword);
        if (this.state === DetectorStates.LISTENING)
        {
            this.currentHotword = hotword;
            this.state = DetectorStates.RECOGNIZING;
        }
    }

    private startStreaming()
    {
        console.log("start streaming");
        const $this = this;
        // this.stream = fs.createWriteStream("/tmp/wav/xx.raw");
        this.stream = speechClient
            .streamingRecognize({
                config: {
                    encoding: "LINEAR16",
                    sampleRateHertz: 16000,
                    languageCode: "de-DE",
                    maxAlternatives: 1,
                    speechContexts: [
                        {
                            phrases: ["uschi", "marshall", "hallo"]
                        }
                    ],
                },
                interimResults: false
            })
            .on("error", console.error)
            .on("data", data =>
            {
                if (data !== null && data.results !== null && data.results.length > 0 && data.results[0].alternatives !== null && data.results[0].alternatives.length > 0)
                {
                    const transcript = data.results[0].alternatives[0].transcript;
                    const confidence = data.results[0].alternatives[0].confidence;
                    if (transcript.toLowerCase().indexOf($this.currentHotword) !== -1)
                    {
                        const cleaned = transcript.replace(/hallo uschi/ig, "").trim();
                        console.log(`recognized: ${cleaned}, with ${confidence} confidence`);
                        $this.emit("result", cleaned);
                    }
                    else
                    {
                        console.warn(`hotword: ${this.currentHotword} could not be verified`);
                        console.log(JSON.stringify(data));
                    }
                }
                else
                {
                    console.warn(`no result for: ${this.currentHotword} in current audio`);
                    console.log(JSON.stringify(data));
                }
            });
    }

    public destroy()
    {
        this.state = DetectorStates.LISTENING;
        if (this.stream !== null)
        {
            this.stream.end();
        }
        this.stream = null;
    }
}

ee(HotwordDetector.prototype);