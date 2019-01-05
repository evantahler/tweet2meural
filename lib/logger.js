const { createLogger, format, transports, config } = require('winston')
const { combine, timestamp, printf, colorize } = format

module.exports = class Logger {
  constructor (level) {
    this.env = process.NODE_ENV || 'development'
    this.level = level || 'info'
    this.logger = createLogger({
      format: combine(
        timestamp(),
        colorize(),
        printf(msg => {
          return `${msg.timestamp} [${this.env} - ${msg.level}]: ${msg.message}`
        })
      ),
      level: this.level,
      levels: config.syslog.levels,
      transports: [ new transports.Console() ]
    })
  }

  log (message, level, data) {
    this.logger.log({
      level: (level || 'info'),
      message: message
    })

    if (data) {
      this.logger.log({
        level: 'info',
        message: data
      })
    }
  }

  logError (error, data, level = 'error') {
    this.logger.log({
      level,
      message: error.toString()
    })

    if (data) {
      for (let key in data) {
        this.logger.log({
          level,
          message: `   ${key}: ${data[key]}`
        })
      }
    }

    let stack = error.stack.split('\n')
    stack.shift()

    stack.forEach((s) => {
      this.logger.log({
        level,
        message: s
      })
    })
  }

  error (error) {
    this.logger.log({
      level: 'error',
      message: error
    })
  }
}
