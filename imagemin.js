const fs = require('fs')
const imagemin = require('imagemin')
const imageminJpegRecompress = require('imagemin-jpeg-recompress')
const imageminWebp = require('imagemin-webp')
const sharp = require('sharp')
const mkdirp = require('mkdirp')

mkdirp(`${__dirname}/build/images`, (err) => {
  if (err) 
    console.error(err)

  fs.readdir(`${__dirname}/img`, (err, files) => {
    files.forEach(file => {
      const sizes = [900, 580]
      const resizePromises = sizes.map(size => {
        const fileName = `${file.slice(0, file.lastIndexOf('.'))}_${size}${file.slice(file.lastIndexOf('.'), file.length)}`

        return sharp(`${__dirname}/img/${file}`)
              .resize(size)
              .max()
              .toFile(`${__dirname}/build/images/${fileName}`)
      })

      return Promise.all(resizePromises).then(_ => {
        return imagemin(['img/*.jpg'], 'build/images', {
            use: [
              imageminJpegRecompress()
            ]
        })
      }).then(_ => {
        return imagemin(['img/*.jpg'], 'build/images', {
            use: [
              imageminWebp({quality: 50})
            ]
        })
      }).catch(console.error)
    })
  })
})