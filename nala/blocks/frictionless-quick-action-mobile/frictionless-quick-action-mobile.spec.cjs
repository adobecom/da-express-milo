const schema = require('./frictionless-quick-action-mobile.block.json');

module.exports = {
  features: schema.variants,
  assets: schema.assets,
  fallback: schema.fallback,
};
