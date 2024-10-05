const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');

fileInput.addEventListener('change', (inputEvent) => {
	if (inputEvent.target.files.length) {
		const fileReader = new FileReader();

		fileReader.onload = (fileReadEvent) => {
			const base64ImgSrc = fileReadEvent.target.result;

            const previewImg = document.createElement('img');
            previewImg.src = base64ImgSrc;
            previewImg.classList = 'previewImg';
            previewImg.title = inputEvent.target.files[0].name;

            previewArea.append(previewImg);
			drawCanvas();
		}

		fileReader.readAsDataURL(inputEvent.target.files[0]);
	}
});

const drawCanvas = () => {
	const images = document.getElementsByClassName('previewImg');
    const imageDatas = [];
	const context = canvas.getContext('2d');
	console.log('images', images);

	const bgImgIndex = 0;
    for (let i = 0; i < images.length; i++) {
        images[i].addEventListener('load', () => {
            canvas.width = images[i].naturalWidth;
            canvas.height = images[i].naturalHeight;

            context.drawImage(images[i], 0, 0);
            imageDatas.push(context.getImageData(0, 0, images[i].naturalWidth, images[i].naturalHeight));
        });
    }
}

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