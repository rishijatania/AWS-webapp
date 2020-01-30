# CSYE 6225 - Spring 2020
Cloud native web application

## Technology Stack
* Backend Technology: **Node JS**
* Framework: **Express**
* Database: **MySQL**
 
## Requirements

For development, you will only need Node.js installed on your environement.
And please use the appropriate [Editorconfig](http://editorconfig.org/) plugin for your Editor (not mandatory).

### Node

[Node](http://nodejs.org/) is really easy to install & now include [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure
below.

    $ node --version
    v0.10.24

    $ npm --version
    1.3.21

#### Node installation on OS X

You will need to use a Terminal. On OS X, you can find the default terminal in
`/Applications/Utilities/Terminal.app`.

Please install [Homebrew](http://brew.sh/) if it's not already done with the following command.

    $ ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"

If everything when fine, you should run

    brew install node

#### Node installation on Linux

    sudo apt-get install python-software-properties
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs

#### Node installation on Windows

Just go on [official Node.js website](http://nodejs.org/) & grab the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it.

### Git installation steps
Just go on the following website to get a step by step guide to install git.
https://git-scm.com/book/en/v2/Getting-Started-Installing-Git

---

## Build Instructions
* Clone repo using command 
```bash
git clone git@github.com:rishijatania/webapp.git
```
* Navigate to webapp directory in api folder using following command
```bash
cd api
```
* Run the following command to install all the project dependencies locally 
```bash
npm install
```
## Deploy Instructions
* To start the application locally run :
```bash
npm start
```
* Test api endpoint using postman or other tool.

## Running Tests
* Run the following command to run unit tests locally
```bash
npm test
```
