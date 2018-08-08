# Gitlab Merge Requests

Google Chrome extension for quick access to Gitlab merge requests.

## Features
- Icon shows number of open merge requests assigned to you.
- Popout shows list of merge requests assigned to, or created by you.
- Can watch open project or group merge requests.

## Installation

### Production
- Not production ready.
- Will live on Chrome Web Store eventually.

### Dev & Testing
1. Open Google Chrome.
2. Go to chrome://extensions (or Menu > More Tools > Extensions).
3. Turn on Developer mode.
4. Click "LOAD UNPACKED".
5. Select the folder where the repository exists.

## Setup

### Connecting to Gitlab
1. Go To [Gitlab Personal Access Tokens](https://gitlab.com/profile/personal_access_tokens).
2. Create a new Access Token with the following Scopes:
    1. api
    2. read_user
    3. read_repository
3. Copy the Access Token
4. Right-click on <img src='icon.png' alt='Gitlab Logo' height='16px'/> in the Chrome menu bar.
5. Click on "Options".
6. Paste the Access Token into the input marked as "Personal Access Token".
7. Press "Save".
