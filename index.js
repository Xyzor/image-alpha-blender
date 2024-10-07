const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const fgAlphaInput = document.getElementById('fgAlpha');
const uploadStatusArea = document.getElementById('uploadStatusArea');
const previewArea = document.getElementById('previewArea');
const reader = new FileReader();
let imagesInPixel = [];

const compositeAOverB = (aColor, bColor, aAlpha, bAlpha, combinedAlpha) => {
    return (aAlpha * aColor + ((1 - aAlpha) * bAlpha * bColor)) / combinedAlpha;
}

const alphaBlend = (bgImg, fgImg, fgAlpha, bgAlpha = 1) => {
    // Two 0-alpha would result in a division-by-zero error.
    // There's no point in blending if aAlpha 0.
    if (fgAlpha === 0) return bgImg;

    const combinedAlpha = fgAlpha + ((1 - fgAlpha) * bgAlpha);
    const bytesAllocatedPerPixel = 4;
    const numberOfPixelsOnFgImg = fgImg.width * fgImg.height;
    const sizeOfFgImgInBytes = numberOfPixelsOnFgImg * bytesAllocatedPerPixel;

    for (let byteIndex = 0; byteIndex < sizeOfFgImgInBytes; byteIndex+= bytesAllocatedPerPixel) {
        const fgRedIndex = byteIndex;
        const fgGreenIndex = byteIndex + 1;
        const fgBlueIndex = byteIndex + 2;

        const noReasonToBlend = !fgImg.data[fgRedIndex] && !fgImg.data[fgGreenIndex] && !fgImg.data[fgBlueIndex];
        if (noReasonToBlend) continue;

        bgImg.data[fgRedIndex] =
            compositeAOverB(fgImg.data[fgRedIndex], bgImg.data[fgRedIndex], fgAlpha, bgAlpha, combinedAlpha);
        bgImg.data[fgGreenIndex] =
            compositeAOverB(fgImg.data[fgGreenIndex], bgImg.data[fgGreenIndex], fgAlpha, bgAlpha, combinedAlpha);
        bgImg.data[fgBlueIndex] =
            compositeAOverB(fgImg.data[fgBlueIndex], bgImg.data[fgBlueIndex], fgAlpha, bgAlpha, combinedAlpha);
    }
}

const renderCanvas = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = imagesInPixel[0].width;
    canvas.height = imagesInPixel[0].height;

    for (let i = imagesInPixel.length - 1; i > 0; i--) {
        alphaBlend(imagesInPixel[i - 1], imagesInPixel[i], Number(fgAlphaInput.value) / 100);
    }
    context.putImageData(imagesInPixel[0], 0, 0);
};

const getPixelDataFromImageElement = (image) => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, canvas.width, canvas.height);
}

const generatePixelInfo = () => {
    imagesInPixel = [];
    const imageElements = document.getElementsByClassName('previewImg');
    for (let ie of imageElements) imagesInPixel.push(getPixelDataFromImageElement(ie));

}

const handleFileReaderEvent = (event) => {
    uploadStatusArea.innerHTML += `<span>${event.type}: ${event.loaded} bytes transferred</span><br/>`;

    if (event.type === "load") {
        const imageElement = document.createElement('img');
        imageElement.src = reader.result;
        imageElement.classList = 'previewImg';
        imageElement.title = fileInput.files[0].name;
        imageElement.onload = () => {
            previewArea.append(imageElement);

            // Re-generate pixel-info array so that on new upload,
            // the blending doesn't use the color values from the previous blending,
            // resulting in extra blendings.
            // It's due to the fact that it's using mutation on the imagesInPixel global array elements.
            //
            // I don't like this global-array-mutation approach
            // but it's the easiest and there's no other reason to change.
            generatePixelInfo();
            
            imagesInPixel.length > 1 && renderCanvas();
        };
    }
}

fileInput.addEventListener('change', () => {
    const selectedFile = fileInput.files[0];

	if (selectedFile) {
        uploadStatusArea.innerHTML += `<b>${selectedFile.name}</b><hr/>`;

        reader.addEventListener("loadstart", handleFileReaderEvent);
        reader.addEventListener("load", handleFileReaderEvent);
        reader.addEventListener("loadend", handleFileReaderEvent);
        reader.addEventListener("progress", handleFileReaderEvent);
        reader.addEventListener("error", handleFileReaderEvent);
        reader.addEventListener("abort", handleFileReaderEvent);

        reader.readAsDataURL(selectedFile);
	}
});

fgAlphaInput.addEventListener('change', (e) => {
    generatePixelInfo();
    imagesInPixel.length > 1 && renderCanvas();
});


//
// Tests
//
const testForegroundAlphaOne = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 255, 0, 255, 0, 255, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgImgData = new ImageData(fgGreenPixelArray, 2, 1);
    alphaBlend(bgImgData, fgImgData, 1);

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
    alphaBlend(bgImgData, fgImgData, 0.5);

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
    alphaBlend(bgImgData, fgImgData, 0.5);

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

const testTwoForeground = () => {
    const bgBluePixelArray  = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]);
    const fgGreenPixelArray = new Uint8ClampedArray([0, 255, 0, 255, 0, 255, 0, 255]);
    const fgRedPixelArray = new Uint8ClampedArray([255, 0, 0, 255, 255, 0, 0, 255]);
    const bgImgData = new ImageData(bgBluePixelArray, 2, 1);
    const fgGreenImgData = new ImageData(fgGreenPixelArray, 2, 1);
    const fgRedImgData = new ImageData(fgRedPixelArray, 2, 1);
    alphaBlend(fgGreenImgData, fgRedImgData, 0.5);
    alphaBlend(bgImgData, fgGreenImgData, 0.5);

    const expected = [64, 64, 128, 255, 64, 64, 128, 255];
    let assertion;
    for (let i = 0; i < 8; i++) {
        assertion = bgImgData.data[i] === expected[i]
        if (!assertion) {
            console.error('expected', expected[i], 'given', bgImgData.data[i]);
            break;
        }
    }
    
    console.warn('testTwoForeground', assertion);
};

const runTestSuit = () => {
   testForegroundAlphaOne(); 
   testForegroundAlphaHalf(); 
   testForegroundTransparentPixel();
};