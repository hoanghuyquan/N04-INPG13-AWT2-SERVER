var express = require('express')
var bodyParser = require('body-parser')
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/myDatabase');
const Data = mongoose.model('Data', { level: String, topic_id: String, topic: String, question: String, audio: String });
const Topic = mongoose.model('Topic', { topic: String, level: String, time: String });
const Statistic = mongoose.model('Statistic', { level: String, point: String });
var multer = require('multer');

// const kitty = new Topic({ topic: '1', level: '1', Time: '2'});
// kitty.save().then(() => console.log('meow'));
// const kitty1 = new Data({ level: '1', topic_id: '1', topic: '1', question: '1', audio: '1'});
// kitty1.save().then(() => console.log('meow1'));

// Where
// db.getCollection('datas').find({ "level": "Difficile" })
// And
// db.getCollection('datas').find({ "level": "Difficile", audio: "Track01.mp3" })
// Or
// db.getCollection('datas').find({ $or: [{ "level": "Difficile" }, { level: "Facile" }] })
// Like
// db.getCollection('datas').find({"question": /vous/})

app = express(),
    port = process.env.PORT || 1234;

app.use("/data", express.static(__dirname + '/data'));

app.use(bodyParser.urlencoded({ extended: false })) // parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse requests of content-type - application/json
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, PATCH, DELETE'
    );
    // Request headers you wish to allow
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With,content-type,Authorization,Origin,Accept'
    );
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

app.get('/get-data', (req, res) => {
    req.query.level ?
        Data.find({ "level": req.query.level }).exec((err, data) => {
            res.json({
                code: 1,
                data: data,
                status: `Get data - level: ${req.query.level} success`
            });
        })
        :
        req.query.topic_id ?
            Data.find({ "topic_id": req.query.topic_id }).exec((err, data) => {
                res.json({
                    code: 1,
                    data: data,
                    status: `Get data - topic: ${req.query.topic_id} success`
                });
            })
            :
            res.json({
                code: 0,
                data: null,
                status: 'Get data error'
            });
});

app.get('/get-topic', (req, res) => {
    req.query.level ?
        Topic.find({ "level": req.query.level }).exec((err, data) => {
            res.json({
                code: 1,
                data: data,
                status: `Get data - level: ${req.query.level} success`
            });
        })
        :
        Topic.find().exec((err, data) => {
            res.json({
                code: 1,
                data: data,
                status: 'Get topic success'
            });
        })
});

app.get('/get-statistic', (req, res) => {
    Statistic.find({ "level": req.query.level }).exec((err, data) => {
        res.json({
            code: 1,
            data: data,
            status: 'Get statistic success'
        });
    })
});

app.post('/submit', function (req, res) {
    if (req.body.answer && req.body.question) {
        var point = new Array;
        var level = req.body.question[0].level;
        for (var i = 0; i < req.body.answer.length; i++) {
            point.push(this.lcs(this.splitText(req.body.answer[i].answer), this.splitText(req.body.question[i].question)));
            if (i === req.body.answer.length - 1) {
                const sts = new Statistic({ level: level, point: this.average(point) });
                sts.save().then(() => console.log('Submit success'));
                res.json({
                    code: 1,
                    level: level,
                    point: this.average(point),
                    status: 'Submit success'
                });
            }
        }
    }
    else {
        res.json({
            error: true,
            code: 0,
            point: null,
            data: null,
            createDate: null,
            status: 'Submit error - body undefined'
        });
    }
});

app.post('/search', (req, res) => {
    req.body.search ?
        Data.find({ $or: [{ "topic": new RegExp(req.body.search) }, { "question": new RegExp(req.body.search) }] }).exec((err, data) => {
            data.length > 0 ? res.json({
                code: 1,
                data: data,
                status: `Search data success`
            }) :
                res.json({
                    code: 0,
                    data: null,
                    status: `Response null`
                });
        })
        :
        res.json({
            code: 0,
            data: null,
            status: 'Search error - search: undefined'
        });
});

app.post('/upload', (req, res) => {
    req.body.item ?
        res.json({
            code: 1,
            data: null,
            status: 'ok'
        })
        :
        res.json({
            code: 0,
            data: null,
            status: 'Upload error - item: undefined'
        });


});

lcs = (answer, question) => {
    var matrix = new Array();
    for (var i = 0; i < answer.length; i++) {
        var arr = new Array();
        for (var j = 0; j <= question.length; j++) {
            if (j === question.length) {
                matrix.push(arr);
            } else {
                if (question[j] === answer[i]) {
                    i - 1 < 0 || j - 1 < 0 ? arr.push(1) : arr.push(matrix[i - 1][j - 1] + 1);
                }
                else {
                    if (j === 0) {
                        if (i === 0) {
                            arr.push(0);
                        }
                        else {
                            arr.push(matrix[i - 1][j]);
                        }
                    }
                    else {
                        if (i === 0) {
                            arr.push(arr[j - 1]);
                        }
                        else {
                            if (matrix[i - 1][j] - arr[j - 1] > 0) {
                                arr.push(matrix[i - 1][j]);
                            } else arr.push(arr[j - 1]);
                        }
                    }
                }
            }
        }
        if (i === answer.length - 1) {
            // console.log('matrix', matrix);
            // console.log('point', matrix[i][j - 2] / question.length);
            return matrix[i][j - 2] / question.length;
        }
    }
}

average = (input) => {
    let avg = 0;
    for (var i = 0; i < input.length; i++) {
        avg = avg + input[i];
        if (i === input.length - 1) {
            return avg / input.length;
        }
    }
}

splitText = (input) => {
    var splitted = input.split(" ");
    return splitted;
}

app.listen(port);