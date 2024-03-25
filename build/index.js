
const esbuild = require('esbuild')
const path = require('path');
const { postOutputFiles } = require('./post');

const outdir = path.resolve(__dirname, '..', 'modules');

esbuild.outdir = outdir;

const configs = [
    {
        format: 'esm',
        outfile: path.resolve(__dirname, '..', 'modules/index.mjs'),
        entryPoints: [
            path.resolve(__dirname, '..', 'lib/index.ts')
        ],
        write: true,
        minify: true,
    },
    {
        format: 'cjs',
        outfile: path.resolve(__dirname, '..', 'modules/index.cjs'),
        entryPoints: [
            path.resolve(__dirname, '..', 'lib/index.ts')
        ],
        write: true,
        minify: true,
    },
    {
        format: 'iife',
        outfile: path.resolve(__dirname, '..', 'modules/index.js'),
        entryPoints: [
            path.resolve(__dirname, '..', 'lib/index.ts')
        ],
        bundle: true,
        write: true,
        globalName: 'pw',
        minify: true,
    }
];

async function start() {

    const startBuildTimeStamp = Date.now();

    for (const config of configs) {
        await esbuild.build(config);
    }

    postOutputFiles(outdir, startBuildTimeStamp);
}


void start();