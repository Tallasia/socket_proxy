define(['ofio/ofio', '_', 'ofio/ofio.jquery'], function (Ofio, _) {
  /**
   * @class Form
   */
  var Form = new Ofio({
    modules: arguments
  });


  Form.prototype.classes = {
    log: 'log'
  };


  Form.prototype.events = {
    submit: '_submit'
  };


  /**
   * @constructor
   */
  Form.prototype.init = function () {
    this._server_id = this.options.id;
    this._socket = this.options.socket;
    this._$log = this.$('.' + this.classes.log);
    this._$input = this.$('input[type="text"]');

    this.$el.appendTo('body');
  };


  /**
   * @function
   */
  Form.prototype._template = _.template(
    '<form class="server_form"><input type="text"/><input type="submit"/><div class="<%= log %>"></div></form>'
  );


  /**
   * @function
   */
  Form.prototype._message_template = _.template(
    '<div class="log_message"></div>'
  );


  Form.prototype.render = function () {
    return this._template(this.classes);
  };


  Form.prototype.log_data = function (data) {
    var $message = $(this._message_template());
    $message.text(data.text).appendTo(this._$log);
  };


  Form.prototype._submit = function (e) {
    e.preventDefault();
    this._socket.emit('data', {
      to: this._server_id,
      text: this._$input.val()
    });
    this._$input.val('');
  };


  Form.prototype.destruct = function () {
    this.$el.remove();
  };


  return Form;
});