const testForegroundAlphaOne = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 255, 0, 255, 0, 255, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgImgData = new ImageData(fgGreenPixelArray, 2, 1);
    blendForegroundIntoBackground(bgImgData, fgImgData, 1);

    const expected = [0, 255, 0, 255, 0, 255, 0, 255];
    let assertion;
    for (let i = 0; i < 8; i++) {
        assertion = bgImgData.data[i] === expected[i]
        if (!assertion) {
            console.error('expected', expected[i], 'given', bgImgData.data[i]);
            break;
        }
    }
    
    console.warn('testForegroundAlphaOne', assertion);
};

const testForegroundAlphaHalf = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 255, 0, 255, 0, 255, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgImgData = new ImageData(fgGreenPixelArray, 2, 1);
    blendForegroundIntoBackground(bgImgData, fgImgData, 0.5);

    const expected = [0, 128, 128, 255, 0, 128, 128, 255];
    let assertion;
    for (let i = 0; i < 8; i++) {
        assertion = bgImgData.data[i] === expected[i]
        if (!assertion) {
            console.error('expected', expected[i], 'given', bgImgData.data[i]);
            break;
        }
    }
    
    console.warn('testForegroundAlphaHalf', assertion);
};

const testForegroundTransparentPixel = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 0, 0, 255, 0, 255, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgImgData = new ImageData(fgGreenPixelArray, 2, 1);
    blendForegroundIntoBackground(bgImgData, fgImgData, 0.5);

    const expected = [0, 0, 255, 255, 0, 128, 128, 255];
    let assertion;
    for (let i = 0; i < 8; i++) {
        assertion = bgImgData.data[i] === expected[i]
        if (!assertion) {
            console.error('expected', expected[i], 'given', bgImgData.data[i]);
            break;
        }
    }
    
    console.warn('testForegroundTransparentPixel', assertion);
};

const testThreeImages = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 255, 0, 255, 0, 255, 0, 255]);
    const fgRedPixelArray = new Uint8ClampedArray([255, 0, 0, 255, 255, 0, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgGreenImgData = new ImageData(fgGreenPixelArray, 2, 1);
    const fgRedImgData = new ImageData(fgRedPixelArray, 2, 1);
    blendForegroundIntoBackground(fgGreenImgData, fgRedImgData, 0.5);
    blendForegroundIntoBackground(bgImgData, fgGreenImgData, 0.5);

    const expected = [64, 64, 128, 255, 64, 64, 128, 255];
    let assertion;
    for (let i = 0; i < 8; i++) {
        assertion = bgImgData.data[i] === expected[i]
        if (!assertion) {
            console.error('expected', expected[i], 'given', bgImgData.data[i]);
            break;
        }
    }
    
    console.warn('testThreeImages', assertion);
};

const testForegroundXOffset = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 255, 0, 255, 0, 0, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgImgData = new ImageData(fgGreenPixelArray, 2, 1);
    blendForegroundIntoBackground(bgImgData, fgImgData, 0.5, 1, 1);

    const expected = [0, 0, 255, 255, 0, 128, 128, 255];
    let assertion;
    for (let i = 0; i < 8; i++) {
        assertion = bgImgData.data[i] === expected[i]
        if (!assertion) {
            console.error('expected', expected[i], 'given', bgImgData.data[i]);
            break;
        }
    }
    
    console.warn('testForegroundXOffset', assertion);
};

const runTestSuit = () => {
   testForegroundAlphaOne(); 
   testForegroundAlphaHalf(); 
   testForegroundTransparentPixel();
   testThreeImages();
   testForegroundXOffset();
};