# My Chrome Extension

This is a Chrome extension that provides various functionalities through a popup interface and options page. 

## Features

- **Popup Interface**: A user-friendly popup that appears when the extension icon is clicked.
- **Options Page**: Allows users to configure settings for the extension.
- **Content Script**: Interacts with web pages to manipulate the DOM.
- **Background Script**: Manages events and handles tasks that need to run in the background.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd my-chrome-extension
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" at the top right.
3. Click on "Load unpacked" and select the `my-chrome-extension` directory.
4. The extension should now be loaded and ready to use.

## Development

- To build the TypeScript files, run:
  ```
  npm run build
  ```
- To watch for changes and automatically compile, run:
  ```
  npm run watch
  ```

## License

This project is licensed under the MIT License. See the LICENSE file for details.