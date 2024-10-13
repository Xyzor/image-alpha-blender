const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const fgAlphaInput = document.getElementById('fgAlpha');
const uploadStatusArea = document.getElementById('uploadStatusArea');
const previewArea = document.getElementById('previewArea');
const reader = new FileReader();
let imagesInPixel = [];

const compositeAOverB = (aColor, aAlpha, bColor, bAlpha, combinedAlpha) => {
    return (aAlpha * aColor + ((1 - aAlpha) * bAlpha * bColor)) / combinedAlpha;
}

const alphaToPercentage = (alpha) => alpha / 255;

const blendForegroundIntoBackground = (bgImg, fgImg, fgAlpha, bgAlpha = 1, xOffsetOfFgInPixel = 0, yOffsetOfFgInPixel = 0) => {
    // Two 0-alpha would result in a division-by-zero error.
    // There's no point in blending if aAlpha 0.
    if (fgAlpha === 0) return bgImg;

    // const combinedAlpha = fgAlpha + ((1 - fgAlpha) * bgAlpha);
    const bytesPerPixel = 4;
    const sizeOfImgInBytesFg = fgImg.width * fgImg.height * bytesPerPixel;
    const xOffsetOfFgInBytes = (xOffsetOfFgInPixel * bytesPerPixel);
    const yOffsetOfFgInBytes = (yOffsetOfFgInPixel * bgImg.width * bytesPerPixel);
    const offsetInPixel = (yOffsetOfFgInPixel * bgImg.width) + xOffsetOfFgInPixel;

    for (let byteIndex = 0; byteIndex < sizeOfImgInBytesFg; byteIndex+= bytesPerPixel) {
        const redIndexFg = byteIndex;
        const greenIndexFg = byteIndex + 1;
        const blueIndexFg = byteIndex + 2;
        const alphaIndexFg = byteIndex + 3;
        const redIndexBg = yOffsetOfFgInBytes + xOffsetOfFgInBytes + redIndexFg;
        const greenIndexBg = redIndexBg + 1;
        const blueIndexBg = redIndexBg + 2;
        const alphaIndexBg = redIndexBg + 3;
        let alphaPercentageFg = alphaToPercentage(fgImg.data[alphaIndexFg]);
        alphaPercentageFg = alphaPercentageFg === 1 ? fgAlpha : alphaPercentageFg;
        let alphaPercentageBg = alphaToPercentage(bgImg.data[alphaIndexBg]);
        alphaPercentageBg = alphaPercentageBg === 1 ? bgAlpha : alphaPercentageBg;
        const combinedAlpha = alphaPercentageFg + ((1 - alphaPercentageFg) * alphaPercentageBg);

        const currentPixelFg = (redIndexFg / bytesPerPixel) + 1;
        const currentPixelBg = (redIndexBg / bytesPerPixel) + 1;
        const currentRowFg = Math.floor((redIndexFg / bytesPerPixel) / fgImg.width) + 1;
        const currentRowBg = Math.floor((redIndexBg / bytesPerPixel)  / bgImg.width) + 1;
        const currentColumnFg = (currentPixelFg % fgImg.width) || fgImg.width;
        const currentColumnBg = (currentPixelBg % bgImg.width) || bgImg.width;
        const isRowOverflow = (currentRowBg - yOffsetOfFgInPixel) != currentRowFg;
        const pixelOfFgIsOutsideOfBg = isRowOverflow || bgImg.data[redIndexBg] === undefined;

        if (pixelOfFgIsOutsideOfBg) continue;

        bgImg.data[redIndexBg] =
            compositeAOverB(
                fgImg.data[redIndexFg],
                alphaPercentageFg,
                bgImg.data[redIndexBg],
                alphaPercentageBg,
                combinedAlpha
            );
        bgImg.data[greenIndexBg] =
            compositeAOverB(
                fgImg.data[greenIndexFg],
                alphaPercentageFg,
                bgImg.data[greenIndexBg],
                alphaPercentageBg,
                combinedAlpha
            );
        bgImg.data[blueIndexBg] =
            compositeAOverB(
                fgImg.data[blueIndexFg],
                alphaPercentageFg,
                bgImg.data[blueIndexBg],
                alphaPercentageBg,
                combinedAlpha
            );
    }
}

const drawBlendedImageDataOnCanvas = () => {
    if (imagesInPixel.length < 2) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = imagesInPixel[0].width;
    canvas.height = imagesInPixel[0].height;

    for (let i = imagesInPixel.length - 1; i > 0; i--) {
        blendForegroundIntoBackground(
            imagesInPixel[i - 1],
            imagesInPixel[i],
            Number(fgAlphaInput.value) / 100,
            1,
            Math.floor(imagesInPixel[i].width * 0.25),
            Math.floor(imagesInPixel[i].height * 0.45),
        );
    }
    context.putImageData(imagesInPixel[0], 0, 0);
};

const convertImageElementToImageData = (image) => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, canvas.width, canvas.height);
}

const refreshImagesInPixelArray = () => {
    imagesInPixel = [];
    const imageElements = document.getElementsByClassName('previewImg');
    for (let ie of imageElements) imagesInPixel.push(convertImageElementToImageData(ie));

}

const handleFileReaderEvent = (event) => {
    uploadStatusArea.innerHTML += `<span>${event.type}: ${event.loaded} bytes transferred</span><br/>`;

    if (event.type === "load") {
        const imageElement = document.createElement('img');
        imageElement.src = reader.result; // image data in base64
        imageElement.classList = 'previewImg';
        imageElement.title = fileInput.files[0].name;
        imageElement.onload = () => {
            previewArea.append(imageElement);

            // Re-generate pixel-info array for every image so that on new upload,
            // the blending doesn't use the color values from previous blending,
            // resulting in extra blendings.
            // It's due to the fact that it's using mutation on the imagesInPixel global array elements.
            //
            // I don't like this global-array-mutation approach
            // but it's the easiest and there's no other reason to change.
            refreshImagesInPixelArray();
            drawBlendedImageDataOnCanvas();
        };
    }
}

fileInput.addEventListener('change', () => {
	if (fileInput.files[0]) {
        uploadStatusArea.innerHTML += `<b>${fileInput.files[0].name}</b><hr/>`;

        reader.addEventListener("loadstart", handleFileReaderEvent);
        reader.addEventListener("load", handleFileReaderEvent);
        reader.addEventListener("loadend", handleFileReaderEvent);
        reader.addEventListener("progress", handleFileReaderEvent);
        reader.addEventListener("error", handleFileReaderEvent);
        reader.addEventListener("abort", handleFileReaderEvent);

        reader.readAsDataURL(fileInput.files[0]);
	}
});

fgAlphaInput.addEventListener('change', (e) => {
    refreshImagesInPixelArray();
    drawBlendedImageDataOnCanvas();
});
