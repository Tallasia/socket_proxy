define(['ofio/ofio', 'Form'], function (Ofio, Form) {
  /**
   * @class FormsManager
   */
  var FormsManager = new Ofio();

  FormsManager.prototype.init = function () {
    this._socket = this.options.socket;
    this._forms = {};
  };

  FormsManager.prototype.create_forms = function (ids) {
    ids.forEach(this.create_form.bind(this));
  };

  FormsManager.prototype.create_form = function (id) {
    this._forms[id] = new Form({
      id: id,
      socket: this._socket
    });
  };

  FormsManager.prototype.remove_forms = function (ids) {
    ids.forEach(this.remove_form.bind(this));
  };

  FormsManager.prototype.remove_form = function (id) {
    var form = this.get_by_id(id);
    if (form) {
      form.destruct();
      delete this._forms[id];
    }
  };

  FormsManager.prototype.get_by_id = function (id) {
    return this._forms[id];
  };

  return FormsManager;
});