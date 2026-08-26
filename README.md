# Image Converter Pro

A privacy-first Chrome Manifest V3 toolbox for converting, resizing, and batch-exporting web images.

## Features

- Right-click conversion to PNG, JPG, WebP, AVIF, BMP, or TIFF (browser support varies).
- Page dashboard that discovers images, previews them, and exports selected images in batches.
- High-quality resizing with aspect ratio preservation.
- Configurable WebP, JPG, and AVIF quality.
- Custom JPG background color for transparent images.
- Original filename or timestamp naming.
- All processing happens locally in the browser.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project directory.

## Use

Right-click an image and select **Image Converter Pro → Convert to…**. To process a page, right-click anywhere and choose **Open page image dashboard**, or open the extension popup and click **Scan this page**.

Open **Extension options** for quality, resize, naming, and JPG background preferences.

## Limitations

AVIF, BMP, and TIFF encoding depends on browser canvas support; unsupported MIME types may fail. Cross-origin restrictions, authentication, protected resources, and Chrome internal pages can prevent conversion. Batch exports use Chrome's native download manager.
