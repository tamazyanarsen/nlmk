function createModel() {
    // Create a sequential model
    const model = tf.sequential();

    // Add a single hidden layer
    model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));

    // Add an output layer
    model.add(tf.layers.dense({ units: 1, useBias: true }));

    return model;
}

function convertToTensor(data) {
    // Wrapping these calculations in a tidy will dispose any
    // intermediate tensors.

    return tf.tidy(() => {
        // Step 1. Shuffle the data
        tf.util.shuffle(data);

        // Step 2. Convert data to Tensor
        const inputs = data.map(d => d.x)
        const labels = data.map(d => d.y);

        const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
        const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

        //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
        const inputMax = inputTensor.max();
        const inputMin = inputTensor.min();
        const labelMax = labelTensor.max();
        const labelMin = labelTensor.min();

        const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
        const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

        return {
            inputs: normalizedInputs,
            labels: normalizedLabels,
            // Return the min/max bounds so we can use them later.
            inputMax,
            inputMin,
            labelMax,
            labelMin,
        }
    });
}

async function trainModel(model, inputs, labels) {
    // Prepare the model for training.
    model.compile({
        optimizer: tf.train.adam(),
        loss: tf.losses.meanSquaredError,
        metrics: ['mse'],
    });

    const batchSize = 32;
    const epochs = 50;

    return await model.fit(inputs, labels, {
        batchSize,
        epochs,
        shuffle: true,
        callbacks: tfvis.show.fitCallbacks(
            { name: 'Training Performance' },
            ['loss', 'mse'],
            { height: 200, callbacks: ['onEpochEnd'] }
        )
    });
}

function testModel(model, inputData, normalizationData) {
    const {inputMax, inputMin, labelMin, labelMax} = normalizationData;

    // Generate predictions for a uniform range of numbers between 0 and 1;
    // We un-normalize the data by doing the inverse of the min-max scaling
    // that we did earlier.
    const [xs, preds] = tf.tidy(() => {

        const xs = tf.linspace(0, 1, 100);
        const preds = model.predict(xs.reshape([100, 1]));

        const unNormXs = xs
            .mul(inputMax.sub(inputMin))
            .add(inputMin);

        const unNormPreds = preds
            .mul(labelMax.sub(labelMin))
            .add(labelMin);

        // Un-normalize the data
        return [unNormXs.dataSync(), unNormPreds.dataSync()];
    });


    const predictedPoints = Array.from(xs).map((val, i) => {
        return {x: val, y: preds[i]}
    });

    console.log('predictedPoints', predictedPoints);

    // inputData [{x: 1, y: 1}]
    tfvis.render.scatterplot(
        {name: 'Model Predictions vs Original Data'},
        {values: [inputData, predictedPoints], series: ['original', 'predicted']},
        {
            xLabel: 'Arc1 - Temp',
            yLabel: 'Temp',
            height: 300
        }
    );
}

async function run(msg = []) {
    const values = msg[0];
    tfvis.render.scatterplot(
        { name: 'Arc1 - Temp' },
        { values },
        {
            xLabel: 'Arc 1',
            yLabel: 'Temp',
            height: 300
        }
    );
    const model = createModel();
    tfvis.show.modelSummary({ name: 'Model Summary' }, model);

    const tensorData = convertToTensor(values);
    const { inputs, labels } = tensorData;

    // Train the model
    await trainModel(model, inputs, labels);
    console.log('Done Training');

    testModel(model, values, tensorData);
}

const ctx = document.getElementById('myChart').getContext('2d');
const { ipcRenderer } = require('electron');
ipcRenderer.on('data', (evt, msg) => {
    console.log(msg);
    run(msg);
    // const myChart = new Chart(ctx, {
    //     type: 'scatter',
    //     data: {
    //         // labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    //         datasets: [{
    //             label: '# of Votes',
    //             data: msg[0],
    //             borderWidth: 1,
    //             backgroundColor: 'white'
    //         }],
    //     },
    //     options: {
    //         scales: {
    //             xAxes: [{
    //                 type: 'linear',
    //                 position: 'bottom'
    //             }]
    //         }
    //     }
    // });
});
ipcRenderer.send('get data', true);