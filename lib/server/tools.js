Function.prototype.inherits = function (super_class) {
  require('util').inherits(this, super_class);

  this.parent = super_class.prototype;

  return this;
};