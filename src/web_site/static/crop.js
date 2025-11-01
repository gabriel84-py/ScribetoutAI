const uploadInput = document.getElementById('upload-input');
const imageToCrop = document.getElementById('image-to-crop');
const cropButton = document.getElementById('crop-button');
let cropper;

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imageToCrop.src = event.target.result;
      if (cropper) cropper.destroy();
      cropper = new Cropper(imageToCrop, {
        aspectRatio: 1, // Ratio 1:1 (carré)
        viewMode: 1,
        autoCropArea: 0.8,
        responsive: true,
      });
    };
    reader.readAsDataURL(file);
  }
});

cropButton.addEventListener('click', () => {
  if (cropper) {
    const canvas = cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'cropped-image.jpg');
      fetch('http://ton-domaine.com/api/upload', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        alert('Image envoyée avec succès !');
      })
      .catch(error => {
        console.error('Erreur :', error);
      });
    }, 'image/jpeg');
  }
});
