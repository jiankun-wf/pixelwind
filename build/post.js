const fs = require('fs');
const path = require('path')
const chalk = require('chalk');

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

async function postOutputFiles(outdir, startBuildTimeStamp) {
  const de = Date.now();

  const fileInfoList = []

  const files = await fs.readdirSync(outdir);

  for(file of files) {
    const filePath = path.resolve(outdir, file);

    const fileInfo = await fs.statSync(filePath);
    
    if(fileInfo.isFile()) {
      fileInfoList.push({
        name: file,
        size: getFileSize(fileInfo.size)
      })
    }
 
  }

    


  console.log(chalk.cyan('-----------------------------------------------------------'))

  fileInfoList.forEach(file => {
      console.log(chalk.blueBright(`${file.name} - ${file.size}`));
  })

  console.log(chalk.cyan('-----------------------------------------------------------'))

  console.log(chalk.green(`✨ [PixelWind] Build complete! Use total ${(de - startBuildTimeStamp) / 1000}s`))
}

module.exports = {
  postOutputFiles, 
}