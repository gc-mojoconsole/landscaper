## Landscaper

### Screenshots/Features

* Works on all platform - Windows, Linux, MacOS

#### Grasscutter Manager

* Update check & One-click update

![CleanShot 2022-06-10 at 23.34.10](https://github.com/gc-mojoconsole/landscaper/blob/electron/.github/images/Readme/CleanShot%202022-06-10%20at%2023.34.10.gif?raw=true)

* Tooltip'd config editor

![CleanShot 2022-06-10 at 23.37.00](https://github.com/gc-mojoconsole/landscaper/blob/electron/.github/images/Readme/CleanShot%202022-06-10%20at%2023.37.00.gif?raw=true)

#### Grasscutter Plugin Manager

![image-20220610231942110](./.github/images/Readme/image-20220610231942110.png)

* Enable/Disable plugin
* Tooltip'd plugin config editor(For some plugins)
* Update check & One-click update
* **Plugin market** One-click install plugin

![image-20220610233855064](.github/images/Readme/image-20220610233855064.png)

### Installation

##### Normal user

Install from github action build. You may use the following links to get the installer.

* [Windows](https://nightly.link/gc-mojoconsole/landscaper/workflows/build/electron/dist-windows-latest.zip)

* [MacOS](https://nightly.link/gc-mojoconsole/landscaper/workflows/build/electron/dist-macos-latest.zip)

* [Linux](https://nightly.link/gc-mojoconsole/landscaper/workflows/build/electron/dist-ubuntu-latest.zip)

##### Developer

```bash
# clone repo
git clone https://github.com/gc-mojoconsole/landscaper

# install dependencies
cd landscaper
npm install
npm install --prefix ./landscaper/

# run
npm start # should work on linux & mac os, not tested on windows yet, PR welcome
```





