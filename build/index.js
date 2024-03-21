
const esbuild = require('esbuild')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

esbuild.outdir = path.resolve(__dirname, '..', 'modules');


const sizeUnits = [
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB'
]

const getFileSize = (size, unit = 0) => {
    const sizeInKB = size / 1024;
    if (sizeInKB > 1024) {
        return getFileSize(sizeInKB / 1024, ++unit)
    }
    return sizeInKB.toFixed(2) + sizeUnits[unit];
}
async function start() {

    const files = []

    const d = Date.now();

    await esbuild.build({
        format: 'esm',
        outfile: path.resolve(__dirname, '..', 'modules/index.mjs'),
        entryPoints: [
            path.resolve(__dirname, '..', 'lib/index.ts')
        ],
        write: true,
        minify: true,
    });
    const esmFs = await fs.statSync(path.resolve(__dirname, '..', 'modules/index.mjs'));
    files.push({ name: path.resolve(__dirname, '..', 'modules/index.mjs'), size: getFileSize(esmFs.size) })

    await esbuild.build({
        format: 'cjs',
        outfile: path.resolve(__dirname, '..', 'modules/index.cjs'),
        entryPoints: [
            path.resolve(__dirname, '..', 'lib/index.ts')
        ],
        write: true,
        minify: true,
    });
    const cjsFs = await fs.statSync(path.resolve(__dirname, '..', 'modules/index.cjs'));
    files.push({ name: path.resolve(__dirname, '..', 'modules/index.cjs'), size: getFileSize(cjsFs.size) })


    await esbuild.build({
        format: 'iife',
        outfile: path.resolve(__dirname, '..', 'modules/index.js'),
        entryPoints: [
            path.resolve(__dirname, '..', 'lib/index.ts')
        ],
        bundle: true,
        write: true,
        globalName: 'pw',
        minify: true,
    });
    const broswerFs = await fs.statSync(path.resolve(__dirname, '..', 'modules/index.js'));
    files.push({ name: path.resolve(__dirname, '..', 'modules/index.js'), size: getFileSize(broswerFs.size) })

    const de = Date.now();


    console.log(chalk.cyan('-----------------------------------------------------------'))

    files.forEach(file => {
        console.log(chalk.blueBright(`${file.name} - ${file.size}`));
    })

    console.log(chalk.cyan('-----------------------------------------------------------'))

    console.log(chalk.green(`Build complete! Use total ${(de - d) / 1000}s`))
}


void start();