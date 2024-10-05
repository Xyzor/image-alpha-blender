const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const uploadStatusArea = document.getElementById('uploadStatusArea');
const reader = new FileReader();
const imagesInPixel = [];

const renderCanvas = () => {
    const imageElements = document.getElementsByClassName('previewImg');
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < imageElements.length; i++) {
        if (!i) {
            canvas.width = imageElements[i].naturalWidth;
            canvas.height = imageElements[i].naturalHeight;
        }
        
        context.drawImage(imageElements[i], 0, 0);
    }
};

const getPixelDataFromImageElement = (image) => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    console.log('Getting ImageData for', image);
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, canvas.width, canvas.height);
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
            imagesInPixel.push(getPixelDataFromImageElement(imageElement));
            renderCanvas();
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

const composite = (bgImg, fgImg, fgOpac) => {
    if (fgOpac === 0) return bgImg;

    const bgOpac = 1;
    // Two 0 alphas would result in a division-by-zero error
    // also there's no point in blending if both are supposed to be hidden.
    // We can go with either pixel's value, so the easiest to just not change the bgImg 
    const combinedAlpha = fgOpac + (1 - fgOpac) * bgOpac;
    const bytesAllocatedPerPixel = 4;

    // const numberOfPixelsOnBgImg = bgImg.width * bgImg.height;
    // const sizeOfBgImgInBytes = numberOfPixelsOnBgImg * bytesAllocatedPerPixel;
    const numberOfPixelsOnFgImg = fgImg.width * fgImg.height;
    const sizeOfFgImgInBytes = numberOfPixelsOnFgImg * bytesAllocatedPerPixel;

    for (
        let fgByteIndex = 0;
        fgByteIndex < sizeOfFgImgInBytes;
        fgByteIndex+= bytesAllocatedPerPixel
    ) {
        const fgRedIndex = fgByteIndex; // First byte that describes the current pixel
        const fgGreenIndex = fgByteIndex + 1; // Jumping +1 byte
        const fgBlueIndex = fgByteIndex + 2; // +2 bytes

        bgImg.data[fgRedIndex] = getBlendedColorValue(fgImg.data[fgRedIndex], fgOpac, bgImg.data[fgRedIndex], bgOpac, combinedAlpha);
        bgImg.data[fgGreenIndex] = getBlendedColorValue(fgImg.data[fgGreenIndex], fgOpac, bgImg.data[fgGreenIndex], bgOpac, combinedAlpha);
        bgImg.data[fgBlueIndex] = getBlendedColorValue(fgImg.data[fgBlueIndex], fgOpac, bgImg.data[fgBlueIndex], bgOpac, combinedAlpha);
    }
}

const getBlendedColorValue = (fgColor, fgAlpha, bgColor, bgAlpha, combinedAlpha) => {
    return (fgAlpha * fgColor + ((1 - fgAlpha) * bgAlpha * bgColor)) / combinedAlpha;
}