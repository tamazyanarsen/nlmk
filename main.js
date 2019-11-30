const parse = require('csv-parse');
const fs = require('fs');

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
        console.log(newTemp);
    });
});