const parse = require('csv-parse');
const fs = require('fs');

function readfileTemp() {
    fs.readFile('./data/data_temp.csv', (err, data) => {
        parse(data.toString(), {
            delimiter: ','
        }, function (err, output) {
            // console.log(output);
            const newTemp = {};
            const lastKey = Math.max(...output.map(e => !!+e[0] ? +e[0] : -1).filter(e => e >= 0));
            for (let i = 0; i <= lastKey; i++) {
                const t = output.filter(e => +e[0] === i).map(e => +e[2]);
                if (t.length) {
                    newTemp[i] = Math.max(...t);
                }
            }
            // console.log(newTemp);
            readFileArc(newTemp);
        });
    });
}

function readFileArc(tempData = {}) {
    fs.readFile('./data/data_arc.csv', (err, data) => {
        parse(data.toString(), {
            delimiter: ','
        }, function (err, output) {
            // console.log(output);
            const newArc1 = {};
            const newArc2 = {};
            const lastKey = Math.max(...output.map(e => !!+e[0] ? +e[0] : -1).filter(e => e >= 0));
            for (let i = 0; i <= lastKey; i++) {
                let t = output.filter(e => +e[0] === i).map(e => +e[3]);
                if (t.length) {
                    newArc1[i] = Math.max(...t);
                }
                t = output.filter(e => +e[0] === i).map(e => +e[4]);
                if (t.length) {
                    newArc2[i] = Math.max(...t);
                }
            }
            // console.log(newArc2);
            const keys = Object.keys(tempData).filter(e => e in newArc1 && e in newArc2);
            const tempArc1 = keys.map(e => ([tempData[e], newArc1[e]]));
            const tempArc2 = keys.map(e => ([tempData[e], newArc2[e]]));
        });
    });
}

readfileTemp();