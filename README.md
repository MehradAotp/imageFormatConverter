# Image Format Converter

A Manifest V3 Chrome extension that converts any accessible webpage image to PNG, WebP, or JPG from the right-click menu.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this project directory.

## Use

Right-click an image, choose **Convert image to…**, then select PNG, WebP, or JPG. The converted file is generated locally and downloaded through Chrome.

Open the extension details and choose **Extension options** to configure WebP/JPG quality and filename behavior.

## Limitations

Some sites block cross-origin image requests, require authentication that is unavailable to the extension, or use protected/canvas-hostile resources. Those images may not be convertible. Chrome internal pages such as `chrome://` are not scriptable.

## Permissions

- `contextMenus`: adds the image conversion menu.
- `downloads`: saves the converted file.
- `storage`: stores quality and filename preferences.
- `notifications`: reports conversion errors.
- `<all_urls>`: lets the extension fetch images from arbitrary webpages.
