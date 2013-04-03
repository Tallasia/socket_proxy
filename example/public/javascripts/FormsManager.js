define(['ofio/ofio', 'Form', 'ofio/ofio.jquery'], function (Ofio, Form) {
  /**
   * @class FormsManager
   */
  var FormsManager = new Ofio({
    modules: arguments
  });

  FormsManager.prototype.init = function () {
    this._socket = this.options.socket;
      console.log('init form manager', this.options.socket);
    this._forms = {};
    this._$no_servers = $('<div>No servers are available</div>').appendTo(this.$el);

    this._servers_exists(false);
  };

  FormsManager.prototype.create_forms = function (ids) {
    ids.forEach(this.create_form.bind(this));
  };

  FormsManager.prototype.create_form = function (data) {
    this._forms[data.id] = new Form({
      id: data.id,
      ip: data.ip,
      socket: this._socket
    });
    this._servers_exists(true);
  };

  FormsManager.prototype.remove_forms = function (ids) {
    ids.forEach(this.remove_form.bind(this));
  };

  FormsManager.prototype.remove_all_forms = function () {
    this.remove_forms(Object.keys(this._forms));
  };

  FormsManager.prototype.remove_form = function (id) {
    var form = this.get_by_id(id);
    if (form) {
      form.destruct();
      delete this._forms[id];
    }
    if (!Object.keys(this._forms).length) {
      this._servers_exists(false);
    }
  };

  FormsManager.prototype.get_by_id = function (id) {
    return this._forms[id];
  };

  FormsManager.prototype._servers_exists = function (exists) {
    this._$no_servers.toggle(!exists);
  };

  return FormsManager;
});