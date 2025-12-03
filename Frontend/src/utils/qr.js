import jsQR from 'jsqr';

export const decodeQrFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Unable to read the selected file.'));

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height, {
            inversionAttempts: 'dontInvert'
          });

          resolve(code ? code.data : null);
        } catch (err) {
          reject(new Error('Failed to decode the QR code.'));
        }
      };
      image.onerror = () => reject(new Error('Unsupported image format.'));
      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
};




