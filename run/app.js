const express = require('express');
const ip = require("ip");
const path = require('path')
const chalk = require('chalk');

const app = express();

const Ip = ip.address();

const startServer = () => {
    const port = 3000;

    app.use(path.resolve(__dirname, '..'));

    app.listen(port, function (err) {
        if (err) {
            throw err;
        }
        const resultPort = this.address().port;
        console.log(chalk.green(`运行成昆 ${env}`));
        console.log(chalk.cyan.underline(`http://localhost:${resultPort}`));
        console.log(chalk.cyan.underline(`http://${Ip}:${resultPort}`));
    });

};

startServer();