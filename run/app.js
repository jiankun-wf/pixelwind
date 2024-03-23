const express = require('express');
const ip = require("ip");
const path = require('path')
const chalk = require('chalk');
const open = require('open')


const app = express();



const Ip = ip.address();

const startServer = () => {
    const port = 3000;

    app.use(express.static(path.resolve(__dirname, '..')));

    app.listen(port, function (err) {
        if (err) {
            throw err;
        }

        const resultPort = this.address().port;
        console.log(chalk.cyan.underline(`http://localhost:${resultPort}`));
        console.log(chalk.cyan.underline(`http://${Ip}:${resultPort}`));
        const isOpen = process.argv.some(arg => arg === '--openBroswer=true');
        isOpen && open(`http://localhost:${resultPort}`);
    });
};

startServer();