'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _keymirror = require('keymirror');

var _keymirror2 = _interopRequireDefault(_keymirror);

var _jsonp = require('jsonp');

var _jsonp2 = _interopRequireDefault(_jsonp);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _PlayButton = require('./Play-Button');

var _PlayButton2 = _interopRequireDefault(_PlayButton);

var _Spinner = require('./Spinner');

var _Spinner2 = _interopRequireDefault(_Spinner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug2.default)('vimeo:player');
var noop = function noop() {};
var playerEvents = (0, _keymirror2.default)({
  cueChange: null,
  ended: null,
  loaded: null,
  pause: null,
  play: null,
  progress: null,
  seeked: null,
  textTrackChange: null,
  timeUpdate: null,
  volumeChange: null
});

function capitalize() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return str.charAt(0).toUpperCase() + str.substring(1);
}

function getFuncForEvent(event, props) {
  return props['on' + capitalize(event)] || function () {};
}

function post(method, value, player, playerOrigin) {
  try {
    player.contentWindow.postMessage({ method: method, value: value }, playerOrigin);
  } catch (err) {
    return err;
  }
  return null;
}

var _class = function (_React$Component) {
  _inherits(_class, _React$Component);

  function _class() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, _class);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = _class.__proto__ || Object.getPrototypeOf(_class)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      imageLoaded: false,
      playerOrigin: '*',
      showingVideo: _this.props.autoplay,
      thumb: null
    }, _this.addMessageListener = function () {
      var _context;

      var addEventListener = typeof window !== 'undefined' ? (_context = window).addEventListener.bind(_context) : noop;

      addEventListener('message', _this.onMessage);
    }, _this.onError = function (err) {
      if (_this.props.onError) {
        _this.props.onError(err);
      }
      throw err;
    }, _this.onMessage = function (_ref2) {
      var origin = _ref2.origin,
          data = _ref2.data;
      var onReady = _this.props.onReady;
      var playerOrigin = _this.state.playerOrigin;


      if (playerOrigin === '*') {
        _this.setState({
          playerOrigin: origin
        });
      }

      // Handle messages from the vimeo player only
      if (!/^https?:\/\/player.vimeo.com/.test(origin)) {
        return false;
      }

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (err) {
          debug('error parsing message', err);
          data = { event: '' };
        }
      }

      if (data.event === 'ready') {
        debug('player ready');
        _this.onReady(_this._player, playerOrigin === '*' ? origin : playerOrigin);
        return onReady(data);
      }
      if (!data.event) {
        // we get messages when the first event callbacks are added to the frame
        return;
      }
      debug('firing event: ', data.event);
      getFuncForEvent(data.event, _this.props)(data);
    }, _this.onReady = function (player, playerOrigin) {
      Object.keys(playerEvents).forEach(function (event) {
        var err = post('addEventListener', event.toLowerCase(), player, playerOrigin);
        if (err) {
          _this.onError(err);
        }
      });
    }, _this.playVideo = function (e) {
      e.preventDefault();
      _this.setState({ showingVideo: true });
    }, _this.getIframeUrl = function () {
      var videoId = _this.props.videoId;

      var query = _this.getIframeUrlQuery();
      return '//player.vimeo.com/video/' + videoId + '?' + query;
    }, _this.getIframeUrlQuery = function () {
      var str = [];
      Object.keys(_this.props.playerOptions).forEach(function (key) {
        str.push(key + '=' + _this.props.playerOptions[key]);
      });

      return str.join('&');
    }, _this.fetchVimeoData = function () {
      if (_this.state.imageLoaded) {
        return;
      }
      var id = _this.props.videoId;

      (0, _jsonp2.default)('//vimeo.com/api/v2/video/' + id + '.json', {
        prefix: 'vimeo'
      }, function (err, res) {
        if (err) {
          debug('jsonp err: ', err.message);
          _this.onError(err);
        }
        debug('jsonp response', res);
        _this.setState({
          thumb: res[0].thumbnail_large,
          imageLoaded: true
        });
      });
    }, _this.renderImage = function () {
      if (_this.state.showingVideo || !_this.state.imageLoaded) {
        return;
      }

      var style = {
        backgroundImage: 'url(' + _this.state.thumb + ')',
        display: !_this.state.showingVideo ? 'block' : 'none',
        height: '100%',
        width: '100%'
      };

      var playButton = _this.props.playButton ? (0, _react.cloneElement)(_this.props.playButton, { onClick: _this.playVideo }) : _react2.default.createElement(_PlayButton2.default, { onClick: _this.playVideo });

      return _react2.default.createElement(
        'div',
        {
          className: 'vimeo-image',
          style: style },
        playButton
      );
    }, _this.renderIframe = function () {
      if (!_this.state.showingVideo) {
        return;
      }

      _this.addMessageListener();

      var embedVideoStyle = {
        display: _this.state.showingVideo ? 'block' : 'none',
        height: '100%',
        width: '100%'
      };

      return _react2.default.createElement(
        'div',
        {
          className: 'vimeo-embed',
          style: embedVideoStyle },
        _react2.default.createElement('iframe', {
          frameBorder: '0',
          ref: function ref(el) {
            _this._player = el;
          },
          src: _this.getIframeUrl() })
      );
    }, _this.renderLoading = function (imageLoaded, loadingElement) {
      if (imageLoaded) {
        return;
      }
      if (loadingElement) {
        return loadingElement;
      }
      return _react2.default.createElement(_Spinner2.default, null);
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(_class, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (nextProps.videoId !== this.props.videoId) {
        this.setState({
          thumb: null,
          imageLoaded: false,
          showingVideo: false
        });
      }
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.fetchVimeoData();
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.fetchVimeoData();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _context2;

      var removeEventListener = typeof window !== 'undefined' ? (_context2 = window).removeEventListener.bind(_context2) : noop;

      removeEventListener('message', this.onMessage);
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: this.props.className, style: this.props.style },
        this.renderLoading(this.state.imageLoaded, this.props.loading),
        this.renderImage(),
        this.renderIframe()
      );
    }
  }]);

  return _class;
}(_react2.default.Component);

_class.displayName = 'Vimeo';
_class.propTypes = {
  autoplay: _propTypes2.default.bool,
  className: _propTypes2.default.string,
  loading: _propTypes2.default.element,
  playButton: _propTypes2.default.node,
  playerOptions: _propTypes2.default.object,
  style: _propTypes2.default.object,
  videoId: _propTypes2.default.string.isRequired,

  // event callbacks
  onCueChange: _propTypes2.default.func,
  onEnded: _propTypes2.default.func,
  onError: _propTypes2.default.func,
  onLoaded: _propTypes2.default.func,
  onPause: _propTypes2.default.func,
  onPlay: _propTypes2.default.func,
  onProgress: _propTypes2.default.func,
  onReady: _propTypes2.default.func,
  onSeeked: _propTypes2.default.func,
  onTextTrackChanged: _propTypes2.default.func,
  onTimeUpdate: _propTypes2.default.func,
  onVolumeChange: _propTypes2.default.func
};

_class.defaultProps = function () {
  var defaults = Object.keys(playerEvents).concat(['ready']).reduce(function (defaults, event) {
    defaults['on' + capitalize(event)] = noop;
    return defaults;
  }, {});

  defaults.className = 'vimeo';
  defaults.playerOptions = { autoplay: 1 };
  defaults.autoplay = false;
  return defaults;
}();

exports.default = _class;
module.exports = exports['default'];