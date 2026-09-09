// Media capture (PNG snapshot & WebM video clip recording)
window.MediaRecorderStudio = {
  // Download PNG snapshot of current canvas or specified high-res size
  downloadSnapshot(renderer, resolution = 'viewport') {
    let dataUrl;
    let filename = `gradient-${renderer.currentShaderId}-${Date.now()}.png`;

    if (resolution === 'viewport') {
      dataUrl = renderer.canvas.toDataURL('image/png');
    } else if (resolution === '1080p') {
      dataUrl = renderer.captureImage(1920, 1080);
    } else if (resolution === '4k') {
      dataUrl = renderer.captureImage(3840, 2160);
    } else if (resolution === 'square') {
      dataUrl = renderer.captureImage(2048, 2048);
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Record a short video loop (e.g., 5 seconds) as WebM
  recordVideo(renderer, durationSec = 5, onProgress, onComplete) {
    const stream = renderer.canvas.captureStream(60);
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }

    const recorder = new MediaRecorder(stream, options);
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gradient-${renderer.currentShaderId}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onComplete) onComplete();
    };

    recorder.start();

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(100, Math.round((elapsed / durationSec) * 100));
      if (onProgress) onProgress(progress);

      if (elapsed >= durationSec) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 100);
  }
};
