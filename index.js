const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const fgAlphaInput = document.getElementById('fgAlpha');
const bgAlphaInput = document.getElementById('bgAlpha');
const fgXOffsetInput = document.getElementById('fgXOffset');
const fgYOffsetInput = document.getElementById('fgYOffset');
const overwriteOnlyNonZero = document.getElementById('overwriteOnlyNonZero');
const downloadCanvasLink = document.getElementById('downloadCanvas');
const previewArea = document.getElementById('previewArea');
const reader = new FileReader();
let imagesInPixel = [];

const compositeAOverB = (aColor, aAlpha, bColor, bAlpha, combinedAlpha) => {
    if (combinedAlpha === 0) return bColor;

    return (aAlpha * aColor + ((1 - aAlpha) * bAlpha * bColor)) / combinedAlpha;
}

const blendForegroundIntoBackground = (imgFg, imgBg, alphaFg, alphaBg, xOffsetInPixelFg = 0, yOffsetInPixelFg = 0) => {
    if (alphaFg === 0 && alphaBg === 0) return imgBg;

    const bytesPerPixel = 4;
    const sizeOfImgInBytesFg = imgFg.width * imgFg.height * bytesPerPixel;
    const xOffsetInBytesFg = (xOffsetInPixelFg * bytesPerPixel);
    const yOffsetInBytesFg = (yOffsetInPixelFg * imgBg.width * bytesPerPixel);

    for (let byteIndexFg = 0; byteIndexFg < sizeOfImgInBytesFg; byteIndexFg += bytesPerPixel) {
        const redIndexFg = byteIndexFg;
        const greenIndexFg = byteIndexFg + 1;
        const blueIndexFg = byteIndexFg + 2;
        const alphaIndexFg = byteIndexFg + 3;
        const redIndexBg = yOffsetInBytesFg + xOffsetInBytesFg + redIndexFg;
        const greenIndexBg = redIndexBg + 1;
        const blueIndexBg = redIndexBg + 2;
        const alphaIndexBg = redIndexBg + 3;

        const alphaInPercentageFg = typeof alphaFg === 'number' ? alphaFg : imgFg.data[alphaIndexFg] / 255;
        const alphaInPercentageBg = typeof alphaBg === 'number' ? alphaBg : imgBg.data[alphaIndexBg] / 255;
        const combinedAlpha = alphaInPercentageFg + ((1 - alphaInPercentageFg) * alphaInPercentageBg);

        // Debugging values
        /*
        const currentPixelFg = (redIndexFg / bytesPerPixel) + 1;
        const currentPixelBg = (redIndexBg / bytesPerPixel) + 1;
        const currentColumnFg = (currentPixelFg % imgFg.width) || imgFg.width;
        const currentColumnBg = (currentPixelBg % imgBg.width) || imgBg.width;
        */

        const rowOfCurrentPixelFg = Math.floor((redIndexFg / bytesPerPixel) / imgFg.width) + 1;
        const rowOfCurrentPixelBg = Math.floor((redIndexBg / bytesPerPixel)  / imgBg.width) + 1;
        const isRowOverflow = (rowOfCurrentPixelBg - yOffsetInPixelFg) != rowOfCurrentPixelFg;
        const fgPixelIsOutsideOfBg = isRowOverflow || imgBg.data[redIndexBg] === undefined;
        const ignoreTransparentPixelFg = imgFg.data[alphaIndexFg] === 0 && overwriteOnlyNonZero.checked;

        if (ignoreTransparentPixelFg || fgPixelIsOutsideOfBg) continue;

        imgBg.data[redIndexBg] =
            compositeAOverB(
                imgFg.data[redIndexFg],
                alphaInPercentageFg,
                imgBg.data[redIndexBg],
                alphaInPercentageBg,
                combinedAlpha
            );
        imgBg.data[greenIndexBg] =
            compositeAOverB(
                imgFg.data[greenIndexFg],
                alphaInPercentageFg,
                imgBg.data[greenIndexBg],
                alphaInPercentageBg,
                combinedAlpha
            );
        imgBg.data[blueIndexBg] =
            compositeAOverB(
                imgFg.data[blueIndexFg],
                alphaInPercentageFg,
                imgBg.data[blueIndexBg],
                alphaInPercentageBg,
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
            imagesInPixel[i],
            imagesInPixel[i - 1],
            fgAlphaInput.value ? Number(fgAlphaInput.value) / 100 : undefined,
            bgAlphaInput.value ? Number(bgAlphaInput.value) / 100 : undefined,
            Math.round(imagesInPixel[i].width * (fgXOffsetInput.value / 100 || 0)),
            Math.round(imagesInPixel[i].height * (fgYOffsetInput.value / 100 || 0)),
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
        updateImageDownloadLink();
    };
}

const updateImageDownloadLink = () => {
    downloadCanvasLink.hidden = false;
    downloadCanvasLink.href = canvas.toDataURL('image/png');
};

fileInput.addEventListener('change', () => {
	if (fileInput.files[0]) {
        reader.addEventListener("load", handleFileReaderEvent);
        reader.readAsDataURL(fileInput.files[0]);
	}
});

fgAlphaInput.addEventListener('change', (e) => {
    refreshImagesInPixelArray();
    drawBlendedImageDataOnCanvas();
    updateImageDownloadLink();
});

bgAlphaInput.addEventListener('change', (e) => {
    refreshImagesInPixelArray();
    drawBlendedImageDataOnCanvas();
    updateImageDownloadLink();
});

fgXOffsetInput.addEventListener('change', (e) => {
    refreshImagesInPixelArray();
    drawBlendedImageDataOnCanvas();
    updateImageDownloadLink();
});

fgYOffsetInput.addEventListener('change', (e) => {
    refreshImagesInPixelArray();
    drawBlendedImageDataOnCanvas();
    updateImageDownloadLink();
});

overwriteOnlyNonZero.addEventListener('change', (e) => {
    refreshImagesInPixelArray();
    drawBlendedImageDataOnCanvas();
    updateImageDownloadLink();
});