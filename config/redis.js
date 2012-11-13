/*
 * Configure 
 */
// Config password for redis
var redisConfig = {};

if (process.env.NODE_ENV === 'production') {
  redisConfig.password = 'DragonLinhVoDichThienHa123456789';
}

module.exports = redisConfig;
