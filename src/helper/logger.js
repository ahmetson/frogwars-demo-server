'use strict'
import { createLogger, format as _format, transports as _transports } from 'winston';

var logLevel = 'info';
if (process.env.NODE_ENV !== 'production') {
  logLevel = 'silly';//silly
} else {
  logLevel = 'info';
}

const logger = createLogger({
    level: logLevel,
    format: _format.combine(
        _format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      _format.errors({ stack: true }),
      _format.splat(),
      _format.json(),
    ),
    timestamp: true,
    defaultMeta: { service: 'api' },
    transports: [
      // Adds extra line of json logs before human logs
      // new winston.transports.Console({
      //   colorize: true,
      //   name: 'ERRORS',
      //   timestamp: () => new Date(),
      //   level: 'error'}),
      // new winston.transports.Console({
      //   colorize: true,
      //   name: 'LOGS',
      //   timestamp: () => new Date()})
    ]
  });

logger.setLevels({
    debug:0,
    info: 1,
    silly:2,
    warn: 3,
    error:4,
});


if (process.env.NODE_ENV !== 'production') {
  logger.add(new _transports.Console({
      level: logLevel || 'silly',
      
      format: _format.combine(
        _format.colorize(),
        _format.prettyPrint(),
        _format.splat(),
        _format.printf((info) => {
          if(info instanceof Error) {
            return `[${info.level}] : ${info.timestamp} : ${info.message} ${info.stack}`;
          }
          return `[${info.level}] : ${info.timestamp} :  ${info.message}`;
        })
      ),
      handleExceptions: true,
      humanReadableUnhandledException: true,
      exitOnError: false,
      timestamp:true 
  }));
} else {
  logger.add(new _transports.Console({
    format: _format.combine(
        //winston.format.colorize(),
        _format.cli(),
    )
  }));
}

logger.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

export default logger;