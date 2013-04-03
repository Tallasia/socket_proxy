define(['ofio/ofio', '_', 'ofio/ofio.jquery'], function (Ofio) {
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
      console.log('form init', this)

    this._server_id = this.options.id;
    this._socket = this.options.socket;
    this._server_ip = this.options.ip;
    this._$log = this.$('.' + this.classes.log);
    this._$input = this.$('input[type="text"]');

    this.$el.appendTo('body');
  };


  /**
   * @function
   */
  Form.prototype._template = _.template(
    '<form class="server_form"><div><%= options.id %>:<%= options.ip %></div><input type="text"/><input type="submit"/><div class="<%= classes.log %>"></div></form>'
  );


  /**
   * @function
   */
  Form.prototype._message_template = _.template(
    '<div class="log_message"></div>'
  );


  Form.prototype.render = function () {
    console.log('Form.prototype.render return this._template({', this.classes, this.options);

    return this._template({
      classes: this.classes,
      options: this.options
    });
  };


  Form.prototype.log_data = function (data) {
    console.log('Form.prototype.log_data',data.text );
    var $message = $(this._message_template());
    $message.text(data.text).appendTo(this._$log);
  };


  Form.prototype._submit = function (e) {
    e.preventDefault();
      console.log('Form.prototype._submit', this._server_id );
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