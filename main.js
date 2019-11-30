const { app, BrowserWindow } = require('electron')

// Храните глобальную ссылку на объект окна, если вы этого не сделаете, окно будет
// автоматически закрываться, когда объект JavaScript собирает мусор.
let win

function createWindow() {
    // Создаём окно браузера.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // и загрузить index.html приложения.
    win.loadFile('index.html')

    // Отображаем средства разработчика.
    win.webContents.openDevTools()

    // Будет вызвано, когда окно будет закрыто.
    win.on('closed', () => {
        // Разбирает объект окна, обычно вы можете хранить окна
        // в массиве, если ваше приложение поддерживает несколько окон в это время,
        // тогда вы должны удалить соответствующий элемент.
        win = null
    })
}

// Этот метод будет вызываться, когда Electron закончит
// инициализацию и готов к созданию окон браузера.
// Некоторые API могут использоваться только после возникновения этого события.
app.on('ready', createWindow)

// Выходим, когда все окна будут закрыты.
app.on('window-all-closed', () => {
    // Для приложений и строки меню в macOS является обычным делом оставаться
    // активными до тех пор, пока пользователь не выйдет окончательно используя Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // На MacOS обычно пересоздают окно в приложении,
    // после того, как на иконку в доке нажали и других открытых окон нету.
    if (win === null) {
        createWindow()
    }
})

const { ipcMain } = require('electron')

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
                    // newArc1[i] = Math.max(...t);
                    newArc1[i] = t.reduce((a, b) => a + b, 0);
                }
                t = output.filter(e => +e[0] === i).map(e => +e[4]);
                if (t.length) {
                    // newArc2[i] = Math.max(...t);
                    newArc2[i] = t.reduce((a, b) => a + b, 0);
                }
            }
            // console.log(newArc2);
            const keys = Object.keys(tempData).filter(e => e in newArc1 && e in newArc2);
            const tempArc1 = keys.map(e => ({ x: tempData[e], y: newArc1[e] }));
            const tempArc2 = keys.map(e => ({ x: tempData[e], y: newArc2[e] }));
            console.log('try emit data to render process');
            ipcMain.on('get data', (evt, data) => { evt.reply('data', [tempArc1, tempArc2]) });
            // console.log(win.webContents.send);
            // win.webContents.send('data', [tempArc1, tempArc2]);
        });
    });
}

readfileTemp();