/**
 * Image Compressor Utility
 */

export const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        try {
          canvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              canvas.toBlob((fallbackBlob) => {
                resolve(fallbackBlob);
              }, 'image/jpeg', quality);
            }
          }, 'image/webp', quality);
        } catch (e) {
          canvas.toBlob((fallbackBlob) => {
            resolve(fallbackBlob);
          }, 'image/jpeg', quality);
        }
      };
    };
  });
};
