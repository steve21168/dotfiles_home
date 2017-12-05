(function() {
  var Disposable, KeymapManager, Point, Range, TextData, VimEditor, _, buildKeydownEvent, buildKeydownEventFromKeystroke, buildTextInputEvent, collectCharPositionsInText, collectIndexInText, dispatch, getView, getVimState, globalState, inspect, isPoint, isRange, normalizeKeystrokes, ref, semver, settings, supportedModeClass, toArray, toArrayOfPoint, toArrayOfRange, withMockPlatform,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  semver = require('semver');

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Disposable = ref.Disposable;

  inspect = require('util').inspect;

  globalState = require('../lib/global-state');

  settings = require('../lib/settings');

  KeymapManager = atom.keymaps.constructor;

  normalizeKeystrokes = require(atom.config.resourcePath + "/node_modules/atom-keymap/lib/helpers").normalizeKeystrokes;

  supportedModeClass = ['normal-mode', 'visual-mode', 'insert-mode', 'replace', 'linewise', 'blockwise', 'characterwise'];

  beforeEach(function() {
    globalState.reset();
    settings.set("stayOnTransformString", false);
    settings.set("stayOnYank", false);
    return settings.set("stayOnDelete", false);
  });

  getView = function(model) {
    return atom.views.getView(model);
  };

  dispatch = function(target, command) {
    return atom.commands.dispatch(target, command);
  };

  withMockPlatform = function(target, platform, fn) {
    var wrapper;
    wrapper = document.createElement('div');
    wrapper.className = platform;
    wrapper.appendChild(target);
    fn();
    return target.parentNode.removeChild(target);
  };

  buildKeydownEvent = function(key, options) {
    return KeymapManager.buildKeydownEvent(key, options);
  };

  buildKeydownEventFromKeystroke = function(keystroke, target) {
    var j, key, len, modifier, options, part, parts;
    modifier = ['ctrl', 'alt', 'shift', 'cmd'];
    parts = keystroke === '-' ? ['-'] : keystroke.split('-');
    options = {
      target: target
    };
    key = null;
    for (j = 0, len = parts.length; j < len; j++) {
      part = parts[j];
      if (indexOf.call(modifier, part) >= 0) {
        options[part] = true;
      } else {
        key = part;
      }
    }
    if (semver.satisfies(atom.getVersion(), '< 1.12')) {
      if (key === 'space') {
        key = ' ';
      }
    }
    return buildKeydownEvent(key, options);
  };

  buildTextInputEvent = function(key) {
    var event, eventArgs;
    eventArgs = [true, true, window, key];
    event = document.createEvent('TextEvent');
    event.initTextEvent.apply(event, ["textInput"].concat(slice.call(eventArgs)));
    return event;
  };

  isPoint = function(obj) {
    if (obj instanceof Point) {
      return true;
    } else {
      return obj.length === 2 && _.isNumber(obj[0]) && _.isNumber(obj[1]);
    }
  };

  isRange = function(obj) {
    if (obj instanceof Range) {
      return true;
    } else {
      return _.all([_.isArray(obj), obj.length === 2, isPoint(obj[0]), isPoint(obj[1])]);
    }
  };

  toArray = function(obj, cond) {
    if (cond == null) {
      cond = null;
    }
    if (_.isArray(cond != null ? cond : obj)) {
      return obj;
    } else {
      return [obj];
    }
  };

  toArrayOfPoint = function(obj) {
    if (_.isArray(obj) && isPoint(obj[0])) {
      return obj;
    } else {
      return [obj];
    }
  };

  toArrayOfRange = function(obj) {
    if (_.isArray(obj) && _.all(obj.map(function(e) {
      return isRange(e);
    }))) {
      return obj;
    } else {
      return [obj];
    }
  };

  getVimState = function() {
    var args, callback, editor, file, ref1;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    ref1 = [], editor = ref1[0], file = ref1[1], callback = ref1[2];
    switch (args.length) {
      case 1:
        callback = args[0];
        break;
      case 2:
        file = args[0], callback = args[1];
    }
    waitsForPromise(function() {
      return atom.packages.activatePackage('vim-mode-plus');
    });
    waitsForPromise(function() {
      if (file) {
        file = atom.project.resolvePath(file);
      }
      return atom.workspace.open(file).then(function(e) {
        return editor = e;
      });
    });
    return runs(function() {
      var main, vimState;
      main = atom.packages.getActivePackage('vim-mode-plus').mainModule;
      vimState = main.getEditorState(editor);
      return callback(vimState, new VimEditor(vimState));
    });
  };

  TextData = (function() {
    function TextData(rawData) {
      this.rawData = rawData;
      this.lines = this.rawData.split("\n");
    }

    TextData.prototype.getLines = function(lines, arg) {
      var chomp, line, text;
      chomp = (arg != null ? arg : {}).chomp;
      if (chomp == null) {
        chomp = false;
      }
      text = ((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = lines.length; j < len; j++) {
          line = lines[j];
          results.push(this.lines[line]);
        }
        return results;
      }).call(this)).join("\n");
      if (chomp) {
        return text;
      } else {
        return text + "\n";
      }
    };

    TextData.prototype.getLine = function(line, options) {
      return this.getLines([line], options);
    };

    TextData.prototype.getRaw = function() {
      return this.rawData;
    };

    return TextData;

  })();

  collectIndexInText = function(char, text) {
    var fromIndex, index, indexes;
    indexes = [];
    fromIndex = 0;
    while ((index = text.indexOf(char, fromIndex)) >= 0) {
      fromIndex = index + 1;
      indexes.push(index);
    }
    return indexes;
  };

  collectCharPositionsInText = function(char, text) {
    var i, index, j, k, len, len1, lineText, positions, ref1, ref2, rowNumber;
    positions = [];
    ref1 = text.split(/\n/);
    for (rowNumber = j = 0, len = ref1.length; j < len; rowNumber = ++j) {
      lineText = ref1[rowNumber];
      ref2 = collectIndexInText(char, lineText);
      for (i = k = 0, len1 = ref2.length; k < len1; i = ++k) {
        index = ref2[i];
        positions.push([rowNumber, index - i]);
      }
    }
    return positions;
  };

  VimEditor = (function() {
    var ensureExclusiveRules, ensureOptionsOrdered, setExclusiveRules, setOptionsOrdered;

    function VimEditor(vimState1) {
      var ref1;
      this.vimState = vimState1;
      this.keystroke = bind(this.keystroke, this);
      this.ensureByDispatch = bind(this.ensureByDispatch, this);
      this.bindEnsureOption = bind(this.bindEnsureOption, this);
      this.ensure = bind(this.ensure, this);
      this.set = bind(this.set, this);
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
    }

    VimEditor.prototype.validateOptions = function(options, validOptions, message) {
      var invalidOptions;
      invalidOptions = _.without.apply(_, [_.keys(options)].concat(slice.call(validOptions)));
      if (invalidOptions.length) {
        throw new Error(message + ": " + (inspect(invalidOptions)));
      }
    };

    VimEditor.prototype.validateExclusiveOptions = function(options, rules) {
      var allOptions, exclusiveOptions, option, results, violatingOptions;
      allOptions = Object.keys(options);
      results = [];
      for (option in rules) {
        exclusiveOptions = rules[option];
        if (!(option in options)) {
          continue;
        }
        violatingOptions = exclusiveOptions.filter(function(exclusiveOption) {
          return indexOf.call(allOptions, exclusiveOption) >= 0;
        });
        if (violatingOptions.length) {
          throw new Error(option + " is exclusive with [" + violatingOptions + "]");
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    setOptionsOrdered = ['text', 'text_', 'textC', 'textC_', 'grammar', 'cursor', 'cursorScreen', 'addCursor', 'cursorScreen', 'register', 'selectedBufferRange'];

    setExclusiveRules = {
      textC: ['cursor', 'cursorScreen'],
      textC_: ['cursor', 'cursorScreen']
    };

    VimEditor.prototype.set = function(options) {
      var j, len, method, name, results;
      this.validateOptions(options, setOptionsOrdered, 'Invalid set options');
      this.validateExclusiveOptions(options, setExclusiveRules);
      results = [];
      for (j = 0, len = setOptionsOrdered.length; j < len; j++) {
        name = setOptionsOrdered[j];
        if (!(options[name] != null)) {
          continue;
        }
        method = 'set' + _.capitalize(_.camelize(name));
        results.push(this[method](options[name]));
      }
      return results;
    };

    VimEditor.prototype.setText = function(text) {
      return this.editor.setText(text);
    };

    VimEditor.prototype.setText_ = function(text) {
      return this.setText(text.replace(/_/g, ' '));
    };

    VimEditor.prototype.setTextC = function(text) {
      var cursors, lastCursor;
      cursors = collectCharPositionsInText('|', text.replace(/!/g, ''));
      lastCursor = collectCharPositionsInText('!', text.replace(/\|/g, ''));
      this.setText(text.replace(/[\|!]/g, ''));
      cursors = cursors.concat(lastCursor);
      if (cursors.length) {
        return this.setCursor(cursors);
      }
    };

    VimEditor.prototype.setTextC_ = function(text) {
      return this.setTextC(text.replace(/_/g, ' '));
    };

    VimEditor.prototype.setGrammar = function(scope) {
      return this.editor.setGrammar(atom.grammars.grammarForScopeName(scope));
    };

    VimEditor.prototype.setCursor = function(points) {
      var j, len, point, results;
      points = toArrayOfPoint(points);
      this.editor.setCursorBufferPosition(points.shift());
      results = [];
      for (j = 0, len = points.length; j < len; j++) {
        point = points[j];
        results.push(this.editor.addCursorAtBufferPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setCursorScreen = function(points) {
      var j, len, point, results;
      points = toArrayOfPoint(points);
      this.editor.setCursorScreenPosition(points.shift());
      results = [];
      for (j = 0, len = points.length; j < len; j++) {
        point = points[j];
        results.push(this.editor.addCursorAtScreenPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setAddCursor = function(points) {
      var j, len, point, ref1, results;
      ref1 = toArrayOfPoint(points);
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        point = ref1[j];
        results.push(this.editor.addCursorAtBufferPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setRegister = function(register) {
      var name, results, value;
      results = [];
      for (name in register) {
        value = register[name];
        results.push(this.vimState.register.set(name, value));
      }
      return results;
    };

    VimEditor.prototype.setSelectedBufferRange = function(range) {
      return this.editor.setSelectedBufferRange(range);
    };

    ensureOptionsOrdered = ['text', 'text_', 'textC', 'textC_', 'selectedText', 'selectedText_', 'selectedTextOrdered', "selectionIsNarrowed", 'cursor', 'cursorScreen', 'numCursors', 'register', 'selectedScreenRange', 'selectedScreenRangeOrdered', 'selectedBufferRange', 'selectedBufferRangeOrdered', 'selectionIsReversed', 'persistentSelectionBufferRange', 'persistentSelectionCount', 'occurrenceCount', 'occurrenceText', 'propertyHead', 'propertyTail', 'scrollTop', 'mark', 'mode'];

    ensureExclusiveRules = {
      textC: ['cursor', 'cursorScreen'],
      textC_: ['cursor', 'cursorScreen']
    };

    VimEditor.prototype.getAndDeleteKeystrokeOptions = function(options) {
      var partialMatchTimeout;
      partialMatchTimeout = options.partialMatchTimeout;
      delete options.partialMatchTimeout;
      return {
        partialMatchTimeout: partialMatchTimeout
      };
    };

    VimEditor.prototype.ensure = function() {
      var args, j, keystroke, keystrokeOptions, len, method, name, options, results;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      switch (args.length) {
        case 1:
          options = args[0];
          break;
        case 2:
          keystroke = args[0], options = args[1];
      }
      if (typeof options !== 'object') {
        throw new Error("Invalid options for 'ensure': must be 'object' but got '" + (typeof options) + "'");
      }
      if ((keystroke != null) && !(typeof keystroke === 'string' || Array.isArray(keystroke))) {
        throw new Error("Invalid keystroke for 'ensure': must be 'string' or 'array' but got '" + (typeof keystroke) + "'");
      }
      keystrokeOptions = this.getAndDeleteKeystrokeOptions(options);
      this.validateOptions(options, ensureOptionsOrdered, 'Invalid ensure option');
      this.validateExclusiveOptions(options, ensureExclusiveRules);
      if (!_.isEmpty(keystroke)) {
        this.keystroke(keystroke, keystrokeOptions);
      }
      results = [];
      for (j = 0, len = ensureOptionsOrdered.length; j < len; j++) {
        name = ensureOptionsOrdered[j];
        if (!(options[name] != null)) {
          continue;
        }
        method = 'ensure' + _.capitalize(_.camelize(name));
        results.push(this[method](options[name]));
      }
      return results;
    };

    VimEditor.prototype.bindEnsureOption = function(optionsBase) {
      return (function(_this) {
        return function(keystroke, options) {
          var intersectingOptions;
          intersectingOptions = _.intersection(_.keys(options), _.keys(optionsBase));
          if (intersectingOptions.length) {
            throw new Error("conflict with bound options " + (inspect(intersectingOptions)));
          }
          return _this.ensure(keystroke, _.defaults(_.clone(options), optionsBase));
        };
      })(this);
    };

    VimEditor.prototype.ensureByDispatch = function(command, options) {
      var j, len, method, name, results;
      dispatch(atom.views.getView(this.editor), command);
      results = [];
      for (j = 0, len = ensureOptionsOrdered.length; j < len; j++) {
        name = ensureOptionsOrdered[j];
        if (!(options[name] != null)) {
          continue;
        }
        method = 'ensure' + _.capitalize(_.camelize(name));
        results.push(this[method](options[name]));
      }
      return results;
    };

    VimEditor.prototype.ensureText = function(text) {
      return expect(this.editor.getText()).toEqual(text);
    };

    VimEditor.prototype.ensureText_ = function(text) {
      return this.ensureText(text.replace(/_/g, ' '));
    };

    VimEditor.prototype.ensureTextC = function(text) {
      var cursors, lastCursor;
      cursors = collectCharPositionsInText('|', text.replace(/!/g, ''));
      lastCursor = collectCharPositionsInText('!', text.replace(/\|/g, ''));
      cursors = cursors.concat(lastCursor);
      cursors = cursors.map(function(point) {
        return Point.fromObject(point);
      }).sort(function(a, b) {
        return a.compare(b);
      });
      this.ensureText(text.replace(/[\|!]/g, ''));
      if (cursors.length) {
        this.ensureCursor(cursors, true);
      }
      if (lastCursor.length) {
        return expect(this.editor.getCursorBufferPosition()).toEqual(lastCursor[0]);
      }
    };

    VimEditor.prototype.ensureTextC_ = function(text) {
      return this.ensureTextC(text.replace(/_/g, ' '));
    };

    VimEditor.prototype.ensureSelectedText = function(text, ordered) {
      var actual, s, selections;
      if (ordered == null) {
        ordered = false;
      }
      selections = ordered ? this.editor.getSelectionsOrderedByBufferPosition() : this.editor.getSelections();
      actual = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = selections.length; j < len; j++) {
          s = selections[j];
          results.push(s.getText());
        }
        return results;
      })();
      return expect(actual).toEqual(toArray(text));
    };

    VimEditor.prototype.ensureSelectedText_ = function(text, ordered) {
      return this.ensureSelectedText(text.replace(/_/g, ' '), ordered);
    };

    VimEditor.prototype.ensureSelectionIsNarrowed = function(isNarrowed) {
      var actual;
      actual = this.vimState.modeManager.isNarrowed();
      return expect(actual).toEqual(isNarrowed);
    };

    VimEditor.prototype.ensureSelectedTextOrdered = function(text) {
      return this.ensureSelectedText(text, true);
    };

    VimEditor.prototype.ensureCursor = function(points, ordered) {
      var actual;
      if (ordered == null) {
        ordered = false;
      }
      actual = this.editor.getCursorBufferPositions();
      actual = actual.sort(function(a, b) {
        if (ordered) {
          return a.compare(b);
        }
      });
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensureCursorScreen = function(points) {
      var actual;
      actual = this.editor.getCursorScreenPositions();
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensureRegister = function(register) {
      var _value, ensure, name, property, reg, results, selection;
      results = [];
      for (name in register) {
        ensure = register[name];
        selection = ensure.selection;
        delete ensure.selection;
        reg = this.vimState.register.get(name, selection);
        results.push((function() {
          var results1;
          results1 = [];
          for (property in ensure) {
            _value = ensure[property];
            results1.push(expect(reg[property]).toEqual(_value));
          }
          return results1;
        })());
      }
      return results;
    };

    VimEditor.prototype.ensureNumCursors = function(number) {
      return expect(this.editor.getCursors()).toHaveLength(number);
    };

    VimEditor.prototype._ensureSelectedRangeBy = function(range, ordered, fn) {
      var actual, s, selections;
      if (ordered == null) {
        ordered = false;
      }
      selections = ordered ? this.editor.getSelectionsOrderedByBufferPosition() : this.editor.getSelections();
      actual = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = selections.length; j < len; j++) {
          s = selections[j];
          results.push(fn(s));
        }
        return results;
      })();
      return expect(actual).toEqual(toArrayOfRange(range));
    };

    VimEditor.prototype.ensureSelectedScreenRange = function(range, ordered) {
      if (ordered == null) {
        ordered = false;
      }
      return this._ensureSelectedRangeBy(range, ordered, function(s) {
        return s.getScreenRange();
      });
    };

    VimEditor.prototype.ensureSelectedScreenRangeOrdered = function(range) {
      return this.ensureSelectedScreenRange(range, true);
    };

    VimEditor.prototype.ensureSelectedBufferRange = function(range, ordered) {
      if (ordered == null) {
        ordered = false;
      }
      return this._ensureSelectedRangeBy(range, ordered, function(s) {
        return s.getBufferRange();
      });
    };

    VimEditor.prototype.ensureSelectedBufferRangeOrdered = function(range) {
      return this.ensureSelectedBufferRange(range, true);
    };

    VimEditor.prototype.ensureSelectionIsReversed = function(reversed) {
      var actual, j, len, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        selection = ref1[j];
        actual = selection.isReversed();
        results.push(expect(actual).toBe(reversed));
      }
      return results;
    };

    VimEditor.prototype.ensurePersistentSelectionBufferRange = function(range) {
      var actual;
      actual = this.vimState.persistentSelection.getMarkerBufferRanges();
      return expect(actual).toEqual(toArrayOfRange(range));
    };

    VimEditor.prototype.ensurePersistentSelectionCount = function(number) {
      var actual;
      actual = this.vimState.persistentSelection.getMarkerCount();
      return expect(actual).toBe(number);
    };

    VimEditor.prototype.ensureOccurrenceCount = function(number) {
      var actual;
      actual = this.vimState.occurrenceManager.getMarkerCount();
      return expect(actual).toBe(number);
    };

    VimEditor.prototype.ensureOccurrenceText = function(text) {
      var actual, markers, r, ranges;
      markers = this.vimState.occurrenceManager.getMarkers();
      ranges = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = markers.length; j < len; j++) {
          r = markers[j];
          results.push(r.getBufferRange());
        }
        return results;
      })();
      actual = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = ranges.length; j < len; j++) {
          r = ranges[j];
          results.push(this.editor.getTextInBufferRange(r));
        }
        return results;
      }).call(this);
      return expect(actual).toEqual(toArray(text));
    };

    VimEditor.prototype.ensurePropertyHead = function(points) {
      var actual, getHeadProperty, s;
      getHeadProperty = (function(_this) {
        return function(selection) {
          return _this.vimState.swrap(selection).getBufferPositionFor('head', {
            from: ['property']
          });
        };
      })(this);
      actual = (function() {
        var j, len, ref1, results;
        ref1 = this.editor.getSelections();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
          s = ref1[j];
          results.push(getHeadProperty(s));
        }
        return results;
      }).call(this);
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensurePropertyTail = function(points) {
      var actual, getTailProperty, s;
      getTailProperty = (function(_this) {
        return function(selection) {
          return _this.vimState.swrap(selection).getBufferPositionFor('tail', {
            from: ['property']
          });
        };
      })(this);
      actual = (function() {
        var j, len, ref1, results;
        ref1 = this.editor.getSelections();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
          s = ref1[j];
          results.push(getTailProperty(s));
        }
        return results;
      }).call(this);
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensureScrollTop = function(scrollTop) {
      var actual;
      actual = this.editorElement.getScrollTop();
      return expect(actual).toEqual(scrollTop);
    };

    VimEditor.prototype.ensureMark = function(mark) {
      var actual, name, point, results;
      results = [];
      for (name in mark) {
        point = mark[name];
        actual = this.vimState.mark.get(name);
        results.push(expect(actual).toEqual(point));
      }
      return results;
    };

    VimEditor.prototype.ensureMode = function(mode) {
      var j, k, len, len1, m, ref1, results, shouldNotContainClasses;
      mode = toArray(mode).slice();
      expect((ref1 = this.vimState).isMode.apply(ref1, mode)).toBe(true);
      mode[0] = mode[0] + "-mode";
      mode = mode.filter(function(m) {
        return m;
      });
      expect(this.editorElement.classList.contains('vim-mode-plus')).toBe(true);
      for (j = 0, len = mode.length; j < len; j++) {
        m = mode[j];
        expect(this.editorElement.classList.contains(m)).toBe(true);
      }
      shouldNotContainClasses = _.difference(supportedModeClass, mode);
      results = [];
      for (k = 0, len1 = shouldNotContainClasses.length; k < len1; k++) {
        m = shouldNotContainClasses[k];
        results.push(expect(this.editorElement.classList.contains(m)).toBe(false));
      }
      return results;
    };

    VimEditor.prototype.keystroke = function(keys, options) {
      var event, finished, j, key, len, ref1, ref2, target;
      if (options == null) {
        options = {};
      }
      if (options.waitsForFinish) {
        finished = false;
        this.vimState.onDidFinishOperation(function() {
          return finished = true;
        });
        delete options.waitsForFinish;
        this.keystroke(keys, options);
        waitsFor(function() {
          return finished;
        });
        return;
      }
      target = this.editorElement;
      ref1 = keys.split(/\s+/);
      for (j = 0, len = ref1.length; j < len; j++) {
        key = ref1[j];
        if ((ref2 = this.vimState.__searchInput) != null ? ref2.hasFocus() : void 0) {
          target = this.vimState.searchInput.editorElement;
          switch (key) {
            case "enter":
              atom.commands.dispatch(target, 'core:confirm');
              break;
            case "escape":
              atom.commands.dispatch(target, 'core:cancel');
              break;
            default:
              this.vimState.searchInput.editor.insertText(key);
          }
        } else if (this.vimState.inputEditor != null) {
          target = this.vimState.inputEditor.element;
          switch (key) {
            case "enter":
              atom.commands.dispatch(target, 'core:confirm');
              break;
            case "escape":
              atom.commands.dispatch(target, 'core:cancel');
              break;
            default:
              this.vimState.inputEditor.insertText(key);
          }
        } else {
          event = buildKeydownEventFromKeystroke(normalizeKeystrokes(key), target);
          atom.keymaps.handleKeyboardEvent(event);
        }
      }
      if (options.partialMatchTimeout) {
        return advanceClock(atom.keymaps.getPartialMatchTimeout());
      }
    };

    return VimEditor;

  })();

  module.exports = {
    getVimState: getVimState,
    getView: getView,
    dispatch: dispatch,
    TextData: TextData,
    withMockPlatform: withMockPlatform
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL3N0ZXZlZ29vZHN0ZWluLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvc3BlYy9zcGVjLWhlbHBlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBYQUFBO0lBQUE7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7RUFDVCxNQUE2QixPQUFBLENBQVEsTUFBUixDQUE3QixFQUFDLGlCQUFELEVBQVEsaUJBQVIsRUFBZTs7RUFDZCxVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUNaLFdBQUEsR0FBYyxPQUFBLENBQVEscUJBQVI7O0VBQ2QsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxhQUFBLEdBQWdCLElBQUksQ0FBQyxPQUFPLENBQUM7O0VBQzVCLHNCQUF1QixPQUFBLENBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFaLEdBQTJCLHVDQUFuQzs7RUFFeEIsa0JBQUEsR0FBcUIsQ0FDbkIsYUFEbUIsRUFFbkIsYUFGbUIsRUFHbkIsYUFIbUIsRUFJbkIsU0FKbUIsRUFLbkIsVUFMbUIsRUFNbkIsV0FObUIsRUFPbkIsZUFQbUI7O0VBWXJCLFVBQUEsQ0FBVyxTQUFBO0lBQ1QsV0FBVyxDQUFDLEtBQVosQ0FBQTtJQUNBLFFBQVEsQ0FBQyxHQUFULENBQWEsdUJBQWIsRUFBc0MsS0FBdEM7SUFDQSxRQUFRLENBQUMsR0FBVCxDQUFhLFlBQWIsRUFBMkIsS0FBM0I7V0FDQSxRQUFRLENBQUMsR0FBVCxDQUFhLGNBQWIsRUFBNkIsS0FBN0I7RUFKUyxDQUFYOztFQVFBLE9BQUEsR0FBVSxTQUFDLEtBQUQ7V0FDUixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsS0FBbkI7RUFEUTs7RUFHVixRQUFBLEdBQVcsU0FBQyxNQUFELEVBQVMsT0FBVDtXQUNULElBQUksQ0FB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SUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLE1BQXZCLEVBQStCLGFBQS9CO0FBQWQ7QUFGUDtjQUdPLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVyxDQUFDLFVBQXRCLENBQWlDLEdBQWpDO0FBSFAsV0FGRztTQUFBLE1BQUE7VUFRSCxLQUFBLEdBQVEsOEJBQUEsQ0FBK0IsbUJBQUEsQ0FBb0IsR0FBcEIsQ0FBL0IsRUFBeUQsTUFBekQ7VUFDUixJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFiLENBQWlDLEtBQWpDLEVBVEc7O0FBVFA7TUFvQkEsSUFBRyxPQUFPLENBQUMsbUJBQVg7ZUFDRSxZQUFBLENBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBYixDQUFBLENBQWIsRUFERjs7SUEvQlM7Ozs7OztFQWtDYixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLGFBQUEsV0FBRDtJQUFjLFNBQUEsT0FBZDtJQUF1QixVQUFBLFFBQXZCO0lBQWlDLFVBQUEsUUFBakM7SUFBMkMsa0JBQUEsZ0JBQTNDOztBQW5lakIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuc2VtdmVyID0gcmVxdWlyZSAnc2VtdmVyJ1xue1JhbmdlLCBQb2ludCwgRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xue2luc3BlY3R9ID0gcmVxdWlyZSAndXRpbCdcbmdsb2JhbFN0YXRlID0gcmVxdWlyZSAnLi4vbGliL2dsb2JhbC1zdGF0ZSdcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vbGliL3NldHRpbmdzJ1xuXG5LZXltYXBNYW5hZ2VyID0gYXRvbS5rZXltYXBzLmNvbnN0cnVjdG9yXG57bm9ybWFsaXplS2V5c3Ryb2tlc30gPSByZXF1aXJlKGF0b20uY29uZmlnLnJlc291cmNlUGF0aCArIFwiL25vZGVfbW9kdWxlcy9hdG9tLWtleW1hcC9saWIvaGVscGVyc1wiKVxuXG5zdXBwb3J0ZWRNb2RlQ2xhc3MgPSBbXG4gICdub3JtYWwtbW9kZSdcbiAgJ3Zpc3VhbC1tb2RlJ1xuICAnaW5zZXJ0LW1vZGUnXG4gICdyZXBsYWNlJ1xuICAnbGluZXdpc2UnXG4gICdibG9ja3dpc2UnXG4gICdjaGFyYWN0ZXJ3aXNlJ1xuXVxuXG4jIEluaXQgc3BlYyBzdGF0ZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5iZWZvcmVFYWNoIC0+XG4gIGdsb2JhbFN0YXRlLnJlc2V0KClcbiAgc2V0dGluZ3Muc2V0KFwic3RheU9uVHJhbnNmb3JtU3RyaW5nXCIsIGZhbHNlKVxuICBzZXR0aW5ncy5zZXQoXCJzdGF5T25ZYW5rXCIsIGZhbHNlKVxuICBzZXR0aW5ncy5zZXQoXCJzdGF5T25EZWxldGVcIiwgZmFsc2UpXG5cbiMgVXRpbHNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZ2V0VmlldyA9IChtb2RlbCkgLT5cbiAgYXRvbS52aWV3cy5nZXRWaWV3KG1vZGVsKVxuXG5kaXNwYXRjaCA9ICh0YXJnZXQsIGNvbW1hbmQpIC0+XG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGFyZ2V0LCBjb21tYW5kKVxuXG53aXRoTW9ja1BsYXRmb3JtID0gKHRhcmdldCwgcGxhdGZvcm0sIGZuKSAtPlxuICB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgd3JhcHBlci5jbGFzc05hbWUgPSBwbGF0Zm9ybVxuICB3cmFwcGVyLmFwcGVuZENoaWxkKHRhcmdldClcbiAgZm4oKVxuICB0YXJnZXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXQpXG5cbmJ1aWxkS2V5ZG93bkV2ZW50ID0gKGtleSwgb3B0aW9ucykgLT5cbiAgS2V5bWFwTWFuYWdlci5idWlsZEtleWRvd25FdmVudChrZXksIG9wdGlvbnMpXG5cbmJ1aWxkS2V5ZG93bkV2ZW50RnJvbUtleXN0cm9rZSA9IChrZXlzdHJva2UsIHRhcmdldCkgLT5cbiAgbW9kaWZpZXIgPSBbJ2N0cmwnLCAnYWx0JywgJ3NoaWZ0JywgJ2NtZCddXG4gIHBhcnRzID0gaWYga2V5c3Ryb2tlIGlzICctJ1xuICAgIFsnLSddXG4gIGVsc2VcbiAgICBrZXlzdHJva2Uuc3BsaXQoJy0nKVxuXG4gIG9wdGlvbnMgPSB7dGFyZ2V0fVxuICBrZXkgPSBudWxsXG4gIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgaWYgcGFydCBpbiBtb2RpZmllclxuICAgICAgb3B0aW9uc1twYXJ0XSA9IHRydWVcbiAgICBlbHNlXG4gICAgICBrZXkgPSBwYXJ0XG5cbiAgaWYgc2VtdmVyLnNhdGlzZmllcyhhdG9tLmdldFZlcnNpb24oKSwgJzwgMS4xMicpXG4gICAga2V5ID0gJyAnIGlmIGtleSBpcyAnc3BhY2UnXG4gIGJ1aWxkS2V5ZG93bkV2ZW50KGtleSwgb3B0aW9ucylcblxuYnVpbGRUZXh0SW5wdXRFdmVudCA9IChrZXkpIC0+XG4gIGV2ZW50QXJncyA9IFtcbiAgICB0cnVlICMgYnViYmxlc1xuICAgIHRydWUgIyBjYW5jZWxhYmxlXG4gICAgd2luZG93ICMgdmlld1xuICAgIGtleSAgIyBrZXkgY2hhclxuICBdXG4gIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ1RleHRFdmVudCcpXG4gIGV2ZW50LmluaXRUZXh0RXZlbnQoXCJ0ZXh0SW5wdXRcIiwgZXZlbnRBcmdzLi4uKVxuICBldmVudFxuXG5pc1BvaW50ID0gKG9iaikgLT5cbiAgaWYgb2JqIGluc3RhbmNlb2YgUG9pbnRcbiAgICB0cnVlXG4gIGVsc2VcbiAgICBvYmoubGVuZ3RoIGlzIDIgYW5kIF8uaXNOdW1iZXIob2JqWzBdKSBhbmQgXy5pc051bWJlcihvYmpbMV0pXG5cbmlzUmFuZ2UgPSAob2JqKSAtPlxuICBpZiBvYmogaW5zdGFuY2VvZiBSYW5nZVxuICAgIHRydWVcbiAgZWxzZVxuICAgIF8uYWxsKFtcbiAgICAgIF8uaXNBcnJheShvYmopLFxuICAgICAgKG9iai5sZW5ndGggaXMgMiksXG4gICAgICBpc1BvaW50KG9ialswXSksXG4gICAgICBpc1BvaW50KG9ialsxXSlcbiAgICBdKVxuXG50b0FycmF5ID0gKG9iaiwgY29uZD1udWxsKSAtPlxuICBpZiBfLmlzQXJyYXkoY29uZCA/IG9iaikgdGhlbiBvYmogZWxzZSBbb2JqXVxuXG50b0FycmF5T2ZQb2ludCA9IChvYmopIC0+XG4gIGlmIF8uaXNBcnJheShvYmopIGFuZCBpc1BvaW50KG9ialswXSlcbiAgICBvYmpcbiAgZWxzZVxuICAgIFtvYmpdXG5cbnRvQXJyYXlPZlJhbmdlID0gKG9iaikgLT5cbiAgaWYgXy5pc0FycmF5KG9iaikgYW5kIF8uYWxsKG9iai5tYXAgKGUpIC0+IGlzUmFuZ2UoZSkpXG4gICAgb2JqXG4gIGVsc2VcbiAgICBbb2JqXVxuXG4jIE1haW5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZ2V0VmltU3RhdGUgPSAoYXJncy4uLikgLT5cbiAgW2VkaXRvciwgZmlsZSwgY2FsbGJhY2tdID0gW11cbiAgc3dpdGNoIGFyZ3MubGVuZ3RoXG4gICAgd2hlbiAxIHRoZW4gW2NhbGxiYWNrXSA9IGFyZ3NcbiAgICB3aGVuIDIgdGhlbiBbZmlsZSwgY2FsbGJhY2tdID0gYXJnc1xuXG4gIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCd2aW0tbW9kZS1wbHVzJylcblxuICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICBmaWxlID0gYXRvbS5wcm9qZWN0LnJlc29sdmVQYXRoKGZpbGUpIGlmIGZpbGVcbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUpLnRoZW4gKGUpIC0+IGVkaXRvciA9IGVcblxuICBydW5zIC0+XG4gICAgbWFpbiA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgndmltLW1vZGUtcGx1cycpLm1haW5Nb2R1bGVcbiAgICB2aW1TdGF0ZSA9IG1haW4uZ2V0RWRpdG9yU3RhdGUoZWRpdG9yKVxuICAgIGNhbGxiYWNrKHZpbVN0YXRlLCBuZXcgVmltRWRpdG9yKHZpbVN0YXRlKSlcblxuY2xhc3MgVGV4dERhdGFcbiAgY29uc3RydWN0b3I6IChAcmF3RGF0YSkgLT5cbiAgICBAbGluZXMgPSBAcmF3RGF0YS5zcGxpdChcIlxcblwiKVxuXG4gIGdldExpbmVzOiAobGluZXMsIHtjaG9tcH09e30pIC0+XG4gICAgY2hvbXAgPz0gZmFsc2VcbiAgICB0ZXh0ID0gKEBsaW5lc1tsaW5lXSBmb3IgbGluZSBpbiBsaW5lcykuam9pbihcIlxcblwiKVxuICAgIGlmIGNob21wXG4gICAgICB0ZXh0XG4gICAgZWxzZVxuICAgICAgdGV4dCArIFwiXFxuXCJcblxuICBnZXRMaW5lOiAobGluZSwgb3B0aW9ucykgLT5cbiAgICBAZ2V0TGluZXMoW2xpbmVdLCBvcHRpb25zKVxuXG4gIGdldFJhdzogLT5cbiAgICBAcmF3RGF0YVxuXG5jb2xsZWN0SW5kZXhJblRleHQgPSAoY2hhciwgdGV4dCkgLT5cbiAgaW5kZXhlcyA9IFtdXG4gIGZyb21JbmRleCA9IDBcbiAgd2hpbGUgKGluZGV4ID0gdGV4dC5pbmRleE9mKGNoYXIsIGZyb21JbmRleCkpID49IDBcbiAgICBmcm9tSW5kZXggPSBpbmRleCArIDFcbiAgICBpbmRleGVzLnB1c2goaW5kZXgpXG4gIGluZGV4ZXNcblxuY29sbGVjdENoYXJQb3NpdGlvbnNJblRleHQgPSAoY2hhciwgdGV4dCkgLT5cbiAgcG9zaXRpb25zID0gW11cbiAgZm9yIGxpbmVUZXh0LCByb3dOdW1iZXIgaW4gdGV4dC5zcGxpdCgvXFxuLylcbiAgICBmb3IgaW5kZXgsIGkgaW4gY29sbGVjdEluZGV4SW5UZXh0KGNoYXIsIGxpbmVUZXh0KVxuICAgICAgcG9zaXRpb25zLnB1c2goW3Jvd051bWJlciwgaW5kZXggLSBpXSlcbiAgcG9zaXRpb25zXG5cbmNsYXNzIFZpbUVkaXRvclxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnR9ID0gQHZpbVN0YXRlXG5cbiAgdmFsaWRhdGVPcHRpb25zOiAob3B0aW9ucywgdmFsaWRPcHRpb25zLCBtZXNzYWdlKSAtPlxuICAgIGludmFsaWRPcHRpb25zID0gXy53aXRob3V0KF8ua2V5cyhvcHRpb25zKSwgdmFsaWRPcHRpb25zLi4uKVxuICAgIGlmIGludmFsaWRPcHRpb25zLmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiI3ttZXNzYWdlfTogI3tpbnNwZWN0KGludmFsaWRPcHRpb25zKX1cIilcblxuICB2YWxpZGF0ZUV4Y2x1c2l2ZU9wdGlvbnM6IChvcHRpb25zLCBydWxlcykgLT5cbiAgICBhbGxPcHRpb25zID0gT2JqZWN0LmtleXMob3B0aW9ucylcbiAgICBmb3Igb3B0aW9uLCBleGNsdXNpdmVPcHRpb25zIG9mIHJ1bGVzIHdoZW4gb3B0aW9uIG9mIG9wdGlvbnNcbiAgICAgIHZpb2xhdGluZ09wdGlvbnMgPSBleGNsdXNpdmVPcHRpb25zLmZpbHRlciAoZXhjbHVzaXZlT3B0aW9uKSAtPiBleGNsdXNpdmVPcHRpb24gaW4gYWxsT3B0aW9uc1xuICAgICAgaWYgdmlvbGF0aW5nT3B0aW9ucy5sZW5ndGhcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiI3tvcHRpb259IGlzIGV4Y2x1c2l2ZSB3aXRoIFsje3Zpb2xhdGluZ09wdGlvbnN9XVwiKVxuXG4gIHNldE9wdGlvbnNPcmRlcmVkID0gW1xuICAgICd0ZXh0JywgJ3RleHRfJyxcbiAgICAndGV4dEMnLCAndGV4dENfJyxcbiAgICAnZ3JhbW1hcicsXG4gICAgJ2N1cnNvcicsICdjdXJzb3JTY3JlZW4nXG4gICAgJ2FkZEN1cnNvcicsICdjdXJzb3JTY3JlZW4nXG4gICAgJ3JlZ2lzdGVyJyxcbiAgICAnc2VsZWN0ZWRCdWZmZXJSYW5nZSdcbiAgXVxuXG4gIHNldEV4Y2x1c2l2ZVJ1bGVzID1cbiAgICB0ZXh0QzogWydjdXJzb3InLCAnY3Vyc29yU2NyZWVuJ11cbiAgICB0ZXh0Q186IFsnY3Vyc29yJywgJ2N1cnNvclNjcmVlbiddXG5cbiAgIyBQdWJsaWNcbiAgc2V0OiAob3B0aW9ucykgPT5cbiAgICBAdmFsaWRhdGVPcHRpb25zKG9wdGlvbnMsIHNldE9wdGlvbnNPcmRlcmVkLCAnSW52YWxpZCBzZXQgb3B0aW9ucycpXG4gICAgQHZhbGlkYXRlRXhjbHVzaXZlT3B0aW9ucyhvcHRpb25zLCBzZXRFeGNsdXNpdmVSdWxlcylcblxuICAgIGZvciBuYW1lIGluIHNldE9wdGlvbnNPcmRlcmVkIHdoZW4gb3B0aW9uc1tuYW1lXT9cbiAgICAgIG1ldGhvZCA9ICdzZXQnICsgXy5jYXBpdGFsaXplKF8uY2FtZWxpemUobmFtZSkpXG4gICAgICB0aGlzW21ldGhvZF0ob3B0aW9uc1tuYW1lXSlcblxuICBzZXRUZXh0OiAodGV4dCkgLT5cbiAgICBAZWRpdG9yLnNldFRleHQodGV4dClcblxuICBzZXRUZXh0XzogKHRleHQpIC0+XG4gICAgQHNldFRleHQodGV4dC5yZXBsYWNlKC9fL2csICcgJykpXG5cbiAgc2V0VGV4dEM6ICh0ZXh0KSAtPlxuICAgIGN1cnNvcnMgPSBjb2xsZWN0Q2hhclBvc2l0aW9uc0luVGV4dCgnfCcsIHRleHQucmVwbGFjZSgvIS9nLCAnJykpXG4gICAgbGFzdEN1cnNvciA9IGNvbGxlY3RDaGFyUG9zaXRpb25zSW5UZXh0KCchJywgdGV4dC5yZXBsYWNlKC9cXHwvZywgJycpKVxuICAgIEBzZXRUZXh0KHRleHQucmVwbGFjZSgvW1xcfCFdL2csICcnKSlcbiAgICBjdXJzb3JzID0gY3Vyc29ycy5jb25jYXQobGFzdEN1cnNvcilcbiAgICBpZiBjdXJzb3JzLmxlbmd0aFxuICAgICAgQHNldEN1cnNvcihjdXJzb3JzKVxuXG4gIHNldFRleHRDXzogKHRleHQpIC0+XG4gICAgQHNldFRleHRDKHRleHQucmVwbGFjZSgvXy9nLCAnICcpKVxuXG4gIHNldEdyYW1tYXI6IChzY29wZSkgLT5cbiAgICBAZWRpdG9yLnNldEdyYW1tYXIoYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKHNjb3BlKSlcblxuICBzZXRDdXJzb3I6IChwb2ludHMpIC0+XG4gICAgcG9pbnRzID0gdG9BcnJheU9mUG9pbnQocG9pbnRzKVxuICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9pbnRzLnNoaWZ0KCkpXG4gICAgZm9yIHBvaW50IGluIHBvaW50c1xuICAgICAgQGVkaXRvci5hZGRDdXJzb3JBdEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIHNldEN1cnNvclNjcmVlbjogKHBvaW50cykgLT5cbiAgICBwb2ludHMgPSB0b0FycmF5T2ZQb2ludChwb2ludHMpXG4gICAgQGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihwb2ludHMuc2hpZnQoKSlcbiAgICBmb3IgcG9pbnQgaW4gcG9pbnRzXG4gICAgICBAZWRpdG9yLmFkZEN1cnNvckF0U2NyZWVuUG9zaXRpb24ocG9pbnQpXG5cbiAgc2V0QWRkQ3Vyc29yOiAocG9pbnRzKSAtPlxuICAgIGZvciBwb2ludCBpbiB0b0FycmF5T2ZQb2ludChwb2ludHMpXG4gICAgICBAZWRpdG9yLmFkZEN1cnNvckF0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgc2V0UmVnaXN0ZXI6IChyZWdpc3RlcikgLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgcmVnaXN0ZXJcbiAgICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5zZXQobmFtZSwgdmFsdWUpXG5cbiAgc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZTogKHJhbmdlKSAtPlxuICAgIEBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShyYW5nZSlcblxuICBlbnN1cmVPcHRpb25zT3JkZXJlZCA9IFtcbiAgICAndGV4dCcsICd0ZXh0XycsXG4gICAgJ3RleHRDJywgJ3RleHRDXycsXG4gICAgJ3NlbGVjdGVkVGV4dCcsICdzZWxlY3RlZFRleHRfJywgJ3NlbGVjdGVkVGV4dE9yZGVyZWQnLCBcInNlbGVjdGlvbklzTmFycm93ZWRcIlxuICAgICdjdXJzb3InLCAnY3Vyc29yU2NyZWVuJ1xuICAgICdudW1DdXJzb3JzJ1xuICAgICdyZWdpc3RlcicsXG4gICAgJ3NlbGVjdGVkU2NyZWVuUmFuZ2UnLCAnc2VsZWN0ZWRTY3JlZW5SYW5nZU9yZGVyZWQnXG4gICAgJ3NlbGVjdGVkQnVmZmVyUmFuZ2UnLCAnc2VsZWN0ZWRCdWZmZXJSYW5nZU9yZGVyZWQnXG4gICAgJ3NlbGVjdGlvbklzUmV2ZXJzZWQnLFxuICAgICdwZXJzaXN0ZW50U2VsZWN0aW9uQnVmZmVyUmFuZ2UnLCAncGVyc2lzdGVudFNlbGVjdGlvbkNvdW50J1xuICAgICdvY2N1cnJlbmNlQ291bnQnLCAnb2NjdXJyZW5jZVRleHQnXG4gICAgJ3Byb3BlcnR5SGVhZCdcbiAgICAncHJvcGVydHlUYWlsJ1xuICAgICdzY3JvbGxUb3AnLFxuICAgICdtYXJrJ1xuICAgICdtb2RlJyxcbiAgXVxuICBlbnN1cmVFeGNsdXNpdmVSdWxlcyA9XG4gICAgdGV4dEM6IFsnY3Vyc29yJywgJ2N1cnNvclNjcmVlbiddXG4gICAgdGV4dENfOiBbJ2N1cnNvcicsICdjdXJzb3JTY3JlZW4nXVxuXG4gIGdldEFuZERlbGV0ZUtleXN0cm9rZU9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIHtwYXJ0aWFsTWF0Y2hUaW1lb3V0fSA9IG9wdGlvbnNcbiAgICBkZWxldGUgb3B0aW9ucy5wYXJ0aWFsTWF0Y2hUaW1lb3V0XG4gICAge3BhcnRpYWxNYXRjaFRpbWVvdXR9XG5cbiAgIyBQdWJsaWNcbiAgZW5zdXJlOiAoYXJncy4uLikgPT5cbiAgICBzd2l0Y2ggYXJncy5sZW5ndGhcbiAgICAgIHdoZW4gMSB0aGVuIFtvcHRpb25zXSA9IGFyZ3NcbiAgICAgIHdoZW4gMiB0aGVuIFtrZXlzdHJva2UsIG9wdGlvbnNdID0gYXJnc1xuXG4gICAgdW5sZXNzIHR5cGVvZihvcHRpb25zKSBpcyAnb2JqZWN0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBvcHRpb25zIGZvciAnZW5zdXJlJzogbXVzdCBiZSAnb2JqZWN0JyBidXQgZ290ICcje3R5cGVvZihvcHRpb25zKX0nXCIpXG4gICAgaWYga2V5c3Ryb2tlPyBhbmQgbm90ICh0eXBlb2Yoa2V5c3Ryb2tlKSBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5KGtleXN0cm9rZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGtleXN0cm9rZSBmb3IgJ2Vuc3VyZSc6IG11c3QgYmUgJ3N0cmluZycgb3IgJ2FycmF5JyBidXQgZ290ICcje3R5cGVvZihrZXlzdHJva2UpfSdcIilcblxuICAgIGtleXN0cm9rZU9wdGlvbnMgPSBAZ2V0QW5kRGVsZXRlS2V5c3Ryb2tlT3B0aW9ucyhvcHRpb25zKVxuXG4gICAgQHZhbGlkYXRlT3B0aW9ucyhvcHRpb25zLCBlbnN1cmVPcHRpb25zT3JkZXJlZCwgJ0ludmFsaWQgZW5zdXJlIG9wdGlvbicpXG4gICAgQHZhbGlkYXRlRXhjbHVzaXZlT3B0aW9ucyhvcHRpb25zLCBlbnN1cmVFeGNsdXNpdmVSdWxlcylcblxuICAgICMgSW5wdXRcbiAgICB1bmxlc3MgXy5pc0VtcHR5KGtleXN0cm9rZSlcbiAgICAgIEBrZXlzdHJva2Uoa2V5c3Ryb2tlLCBrZXlzdHJva2VPcHRpb25zKVxuXG4gICAgZm9yIG5hbWUgaW4gZW5zdXJlT3B0aW9uc09yZGVyZWQgd2hlbiBvcHRpb25zW25hbWVdP1xuICAgICAgbWV0aG9kID0gJ2Vuc3VyZScgKyBfLmNhcGl0YWxpemUoXy5jYW1lbGl6ZShuYW1lKSlcbiAgICAgIHRoaXNbbWV0aG9kXShvcHRpb25zW25hbWVdKVxuXG4gIGJpbmRFbnN1cmVPcHRpb246IChvcHRpb25zQmFzZSkgPT5cbiAgICAoa2V5c3Ryb2tlLCBvcHRpb25zKSA9PlxuICAgICAgaW50ZXJzZWN0aW5nT3B0aW9ucyA9IF8uaW50ZXJzZWN0aW9uKF8ua2V5cyhvcHRpb25zKSwgXy5rZXlzKG9wdGlvbnNCYXNlKSlcbiAgICAgIGlmIGludGVyc2VjdGluZ09wdGlvbnMubGVuZ3RoXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvbmZsaWN0IHdpdGggYm91bmQgb3B0aW9ucyAje2luc3BlY3QoaW50ZXJzZWN0aW5nT3B0aW9ucyl9XCIpXG5cbiAgICAgIEBlbnN1cmUoa2V5c3Ryb2tlLCBfLmRlZmF1bHRzKF8uY2xvbmUob3B0aW9ucyksIG9wdGlvbnNCYXNlKSlcblxuICBlbnN1cmVCeURpc3BhdGNoOiAoY29tbWFuZCwgb3B0aW9ucykgPT5cbiAgICBkaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvciksIGNvbW1hbmQpXG4gICAgZm9yIG5hbWUgaW4gZW5zdXJlT3B0aW9uc09yZGVyZWQgd2hlbiBvcHRpb25zW25hbWVdP1xuICAgICAgbWV0aG9kID0gJ2Vuc3VyZScgKyBfLmNhcGl0YWxpemUoXy5jYW1lbGl6ZShuYW1lKSlcbiAgICAgIHRoaXNbbWV0aG9kXShvcHRpb25zW25hbWVdKVxuXG4gIGVuc3VyZVRleHQ6ICh0ZXh0KSAtPlxuICAgIGV4cGVjdChAZWRpdG9yLmdldFRleHQoKSkudG9FcXVhbCh0ZXh0KVxuXG4gIGVuc3VyZVRleHRfOiAodGV4dCkgLT5cbiAgICBAZW5zdXJlVGV4dCh0ZXh0LnJlcGxhY2UoL18vZywgJyAnKSlcblxuICBlbnN1cmVUZXh0QzogKHRleHQpIC0+XG4gICAgY3Vyc29ycyA9IGNvbGxlY3RDaGFyUG9zaXRpb25zSW5UZXh0KCd8JywgdGV4dC5yZXBsYWNlKC8hL2csICcnKSlcbiAgICBsYXN0Q3Vyc29yID0gY29sbGVjdENoYXJQb3NpdGlvbnNJblRleHQoJyEnLCB0ZXh0LnJlcGxhY2UoL1xcfC9nLCAnJykpXG4gICAgY3Vyc29ycyA9IGN1cnNvcnMuY29uY2F0KGxhc3RDdXJzb3IpXG4gICAgY3Vyc29ycyA9IGN1cnNvcnNcbiAgICAgIC5tYXAgKHBvaW50KSAtPiBQb2ludC5mcm9tT2JqZWN0KHBvaW50KVxuICAgICAgLnNvcnQgKGEsIGIpIC0+IGEuY29tcGFyZShiKVxuICAgIEBlbnN1cmVUZXh0KHRleHQucmVwbGFjZSgvW1xcfCFdL2csICcnKSlcbiAgICBpZiBjdXJzb3JzLmxlbmd0aFxuICAgICAgQGVuc3VyZUN1cnNvcihjdXJzb3JzLCB0cnVlKVxuXG4gICAgaWYgbGFzdEN1cnNvci5sZW5ndGhcbiAgICAgIGV4cGVjdChAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwobGFzdEN1cnNvclswXSlcblxuICBlbnN1cmVUZXh0Q186ICh0ZXh0KSAtPlxuICAgIEBlbnN1cmVUZXh0Qyh0ZXh0LnJlcGxhY2UoL18vZywgJyAnKSlcblxuICBlbnN1cmVTZWxlY3RlZFRleHQ6ICh0ZXh0LCBvcmRlcmVkPWZhbHNlKSAtPlxuICAgIHNlbGVjdGlvbnMgPSBpZiBvcmRlcmVkXG4gICAgICBAZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBhY3R1YWwgPSAocy5nZXRUZXh0KCkgZm9yIHMgaW4gc2VsZWN0aW9ucylcbiAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsKHRvQXJyYXkodGV4dCkpXG5cbiAgZW5zdXJlU2VsZWN0ZWRUZXh0XzogKHRleHQsIG9yZGVyZWQpIC0+XG4gICAgQGVuc3VyZVNlbGVjdGVkVGV4dCh0ZXh0LnJlcGxhY2UoL18vZywgJyAnKSwgb3JkZXJlZClcblxuICBlbnN1cmVTZWxlY3Rpb25Jc05hcnJvd2VkOiAoaXNOYXJyb3dlZCkgLT5cbiAgICBhY3R1YWwgPSBAdmltU3RhdGUubW9kZU1hbmFnZXIuaXNOYXJyb3dlZCgpXG4gICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbChpc05hcnJvd2VkKVxuXG4gIGVuc3VyZVNlbGVjdGVkVGV4dE9yZGVyZWQ6ICh0ZXh0KSAtPlxuICAgIEBlbnN1cmVTZWxlY3RlZFRleHQodGV4dCwgdHJ1ZSlcblxuICBlbnN1cmVDdXJzb3I6IChwb2ludHMsIG9yZGVyZWQ9ZmFsc2UpIC0+XG4gICAgYWN0dWFsID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMoKVxuICAgIGFjdHVhbCA9IGFjdHVhbC5zb3J0IChhLCBiKSAtPiBhLmNvbXBhcmUoYikgaWYgb3JkZXJlZFxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwodG9BcnJheU9mUG9pbnQocG9pbnRzKSlcblxuICBlbnN1cmVDdXJzb3JTY3JlZW46IChwb2ludHMpIC0+XG4gICAgYWN0dWFsID0gQGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbnMoKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwodG9BcnJheU9mUG9pbnQocG9pbnRzKSlcblxuICBlbnN1cmVSZWdpc3RlcjogKHJlZ2lzdGVyKSAtPlxuICAgIGZvciBuYW1lLCBlbnN1cmUgb2YgcmVnaXN0ZXJcbiAgICAgIHtzZWxlY3Rpb259ID0gZW5zdXJlXG4gICAgICBkZWxldGUgZW5zdXJlLnNlbGVjdGlvblxuICAgICAgcmVnID0gQHZpbVN0YXRlLnJlZ2lzdGVyLmdldChuYW1lLCBzZWxlY3Rpb24pXG4gICAgICBmb3IgcHJvcGVydHksIF92YWx1ZSBvZiBlbnN1cmVcbiAgICAgICAgZXhwZWN0KHJlZ1twcm9wZXJ0eV0pLnRvRXF1YWwoX3ZhbHVlKVxuXG4gIGVuc3VyZU51bUN1cnNvcnM6IChudW1iZXIpIC0+XG4gICAgZXhwZWN0KEBlZGl0b3IuZ2V0Q3Vyc29ycygpKS50b0hhdmVMZW5ndGggbnVtYmVyXG5cbiAgX2Vuc3VyZVNlbGVjdGVkUmFuZ2VCeTogKHJhbmdlLCBvcmRlcmVkPWZhbHNlLCBmbikgLT5cbiAgICBzZWxlY3Rpb25zID0gaWYgb3JkZXJlZFxuICAgICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgYWN0dWFsID0gKGZuKHMpIGZvciBzIGluIHNlbGVjdGlvbnMpXG4gICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbCh0b0FycmF5T2ZSYW5nZShyYW5nZSkpXG5cbiAgZW5zdXJlU2VsZWN0ZWRTY3JlZW5SYW5nZTogKHJhbmdlLCBvcmRlcmVkPWZhbHNlKSAtPlxuICAgIEBfZW5zdXJlU2VsZWN0ZWRSYW5nZUJ5IHJhbmdlLCBvcmRlcmVkLCAocykgLT4gcy5nZXRTY3JlZW5SYW5nZSgpXG5cbiAgZW5zdXJlU2VsZWN0ZWRTY3JlZW5SYW5nZU9yZGVyZWQ6IChyYW5nZSkgLT5cbiAgICBAZW5zdXJlU2VsZWN0ZWRTY3JlZW5SYW5nZShyYW5nZSwgdHJ1ZSlcblxuICBlbnN1cmVTZWxlY3RlZEJ1ZmZlclJhbmdlOiAocmFuZ2UsIG9yZGVyZWQ9ZmFsc2UpIC0+XG4gICAgQF9lbnN1cmVTZWxlY3RlZFJhbmdlQnkgcmFuZ2UsIG9yZGVyZWQsIChzKSAtPiBzLmdldEJ1ZmZlclJhbmdlKClcblxuICBlbnN1cmVTZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZDogKHJhbmdlKSAtPlxuICAgIEBlbnN1cmVTZWxlY3RlZEJ1ZmZlclJhbmdlKHJhbmdlLCB0cnVlKVxuXG4gIGVuc3VyZVNlbGVjdGlvbklzUmV2ZXJzZWQ6IChyZXZlcnNlZCkgLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBhY3R1YWwgPSBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBleHBlY3QoYWN0dWFsKS50b0JlKHJldmVyc2VkKVxuXG4gIGVuc3VyZVBlcnNpc3RlbnRTZWxlY3Rpb25CdWZmZXJSYW5nZTogKHJhbmdlKSAtPlxuICAgIGFjdHVhbCA9IEB2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckJ1ZmZlclJhbmdlcygpXG4gICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbCh0b0FycmF5T2ZSYW5nZShyYW5nZSkpXG5cbiAgZW5zdXJlUGVyc2lzdGVudFNlbGVjdGlvbkNvdW50OiAobnVtYmVyKSAtPlxuICAgIGFjdHVhbCA9IEB2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckNvdW50KClcbiAgICBleHBlY3QoYWN0dWFsKS50b0JlIG51bWJlclxuXG4gIGVuc3VyZU9jY3VycmVuY2VDb3VudDogKG51bWJlcikgLT5cbiAgICBhY3R1YWwgPSBAdmltU3RhdGUub2NjdXJyZW5jZU1hbmFnZXIuZ2V0TWFya2VyQ291bnQoKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvQmUgbnVtYmVyXG5cbiAgZW5zdXJlT2NjdXJyZW5jZVRleHQ6ICh0ZXh0KSAtPlxuICAgIG1hcmtlcnMgPSBAdmltU3RhdGUub2NjdXJyZW5jZU1hbmFnZXIuZ2V0TWFya2VycygpXG4gICAgcmFuZ2VzID0gKHIuZ2V0QnVmZmVyUmFuZ2UoKSBmb3IgciBpbiBtYXJrZXJzKVxuICAgIGFjdHVhbCA9IChAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHIpIGZvciByIGluIHJhbmdlcylcbiAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsKHRvQXJyYXkodGV4dCkpXG5cbiAgZW5zdXJlUHJvcGVydHlIZWFkOiAocG9pbnRzKSAtPlxuICAgIGdldEhlYWRQcm9wZXJ0eSA9IChzZWxlY3Rpb24pID0+XG4gICAgICBAdmltU3RhdGUuc3dyYXAoc2VsZWN0aW9uKS5nZXRCdWZmZXJQb3NpdGlvbkZvcignaGVhZCcsIGZyb206IFsncHJvcGVydHknXSlcbiAgICBhY3R1YWwgPSAoZ2V0SGVhZFByb3BlcnR5KHMpIGZvciBzIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwodG9BcnJheU9mUG9pbnQocG9pbnRzKSlcblxuICBlbnN1cmVQcm9wZXJ0eVRhaWw6IChwb2ludHMpIC0+XG4gICAgZ2V0VGFpbFByb3BlcnR5ID0gKHNlbGVjdGlvbikgPT5cbiAgICAgIEB2aW1TdGF0ZS5zd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCd0YWlsJywgZnJvbTogWydwcm9wZXJ0eSddKVxuICAgIGFjdHVhbCA9IChnZXRUYWlsUHJvcGVydHkocykgZm9yIHMgaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkpXG4gICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbCh0b0FycmF5T2ZQb2ludChwb2ludHMpKVxuXG4gIGVuc3VyZVNjcm9sbFRvcDogKHNjcm9sbFRvcCkgLT5cbiAgICBhY3R1YWwgPSBAZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxUb3AoKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwgc2Nyb2xsVG9wXG5cbiAgZW5zdXJlTWFyazogKG1hcmspIC0+XG4gICAgZm9yIG5hbWUsIHBvaW50IG9mIG1hcmtcbiAgICAgIGFjdHVhbCA9IEB2aW1TdGF0ZS5tYXJrLmdldChuYW1lKVxuICAgICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbChwb2ludClcblxuICBlbnN1cmVNb2RlOiAobW9kZSkgLT5cbiAgICBtb2RlID0gdG9BcnJheShtb2RlKS5zbGljZSgpXG4gICAgZXhwZWN0KEB2aW1TdGF0ZS5pc01vZGUobW9kZS4uLikpLnRvQmUodHJ1ZSlcblxuICAgIG1vZGVbMF0gPSBcIiN7bW9kZVswXX0tbW9kZVwiXG4gICAgbW9kZSA9IG1vZGUuZmlsdGVyKChtKSAtPiBtKVxuICAgIGV4cGVjdChAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ3ZpbS1tb2RlLXBsdXMnKSkudG9CZSh0cnVlKVxuICAgIGZvciBtIGluIG1vZGVcbiAgICAgIGV4cGVjdChAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMobSkpLnRvQmUodHJ1ZSlcbiAgICBzaG91bGROb3RDb250YWluQ2xhc3NlcyA9IF8uZGlmZmVyZW5jZShzdXBwb3J0ZWRNb2RlQ2xhc3MsIG1vZGUpXG4gICAgZm9yIG0gaW4gc2hvdWxkTm90Q29udGFpbkNsYXNzZXNcbiAgICAgIGV4cGVjdChAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMobSkpLnRvQmUoZmFsc2UpXG5cbiAgIyBQdWJsaWNcbiAgIyBvcHRpb25zXG4gICMgLSB3YWl0c0ZvckZpbmlzaFxuICBrZXlzdHJva2U6IChrZXlzLCBvcHRpb25zPXt9KSA9PlxuICAgIGlmIG9wdGlvbnMud2FpdHNGb3JGaW5pc2hcbiAgICAgIGZpbmlzaGVkID0gZmFsc2VcbiAgICAgIEB2aW1TdGF0ZS5vbkRpZEZpbmlzaE9wZXJhdGlvbiAtPiBmaW5pc2hlZCA9IHRydWVcbiAgICAgIGRlbGV0ZSBvcHRpb25zLndhaXRzRm9yRmluaXNoXG4gICAgICBAa2V5c3Ryb2tlKGtleXMsIG9wdGlvbnMpXG4gICAgICB3YWl0c0ZvciAtPiBmaW5pc2hlZFxuICAgICAgcmV0dXJuXG5cbiAgICB0YXJnZXQgPSBAZWRpdG9yRWxlbWVudFxuXG4gICAgZm9yIGtleSBpbiBrZXlzLnNwbGl0KC9cXHMrLylcbiAgICAgICMgW0ZJWE1FXSBXaHkgY2FuJ3QgSSBsZXQgYXRvbS5rZXltYXBzIGhhbmRsZSBlbnRlci9lc2NhcGUgYnkgYnVpbGRFdmVudCBhbmQgaGFuZGxlS2V5Ym9hcmRFdmVudFxuICAgICAgaWYgQHZpbVN0YXRlLl9fc2VhcmNoSW5wdXQ/Lmhhc0ZvY3VzKCkgIyB0byBhdm9pZCBhdXRvIHBvcHVsYXRlXG4gICAgICAgIHRhcmdldCA9IEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5lZGl0b3JFbGVtZW50XG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICB3aGVuIFwiZW50ZXJcIiB0aGVuIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGFyZ2V0LCAnY29yZTpjb25maXJtJylcbiAgICAgICAgICB3aGVuIFwiZXNjYXBlXCIgdGhlbiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKHRhcmdldCwgJ2NvcmU6Y2FuY2VsJylcbiAgICAgICAgICBlbHNlIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5lZGl0b3IuaW5zZXJ0VGV4dChrZXkpXG5cbiAgICAgIGVsc2UgaWYgQHZpbVN0YXRlLmlucHV0RWRpdG9yP1xuICAgICAgICB0YXJnZXQgPSBAdmltU3RhdGUuaW5wdXRFZGl0b3IuZWxlbWVudFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgd2hlbiBcImVudGVyXCIgdGhlbiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKHRhcmdldCwgJ2NvcmU6Y29uZmlybScpXG4gICAgICAgICAgd2hlbiBcImVzY2FwZVwiIHRoZW4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaCh0YXJnZXQsICdjb3JlOmNhbmNlbCcpXG4gICAgICAgICAgZWxzZSBAdmltU3RhdGUuaW5wdXRFZGl0b3IuaW5zZXJ0VGV4dChrZXkpXG5cbiAgICAgIGVsc2VcbiAgICAgICAgZXZlbnQgPSBidWlsZEtleWRvd25FdmVudEZyb21LZXlzdHJva2Uobm9ybWFsaXplS2V5c3Ryb2tlcyhrZXkpLCB0YXJnZXQpXG4gICAgICAgIGF0b20ua2V5bWFwcy5oYW5kbGVLZXlib2FyZEV2ZW50KGV2ZW50KVxuXG4gICAgaWYgb3B0aW9ucy5wYXJ0aWFsTWF0Y2hUaW1lb3V0XG4gICAgICBhZHZhbmNlQ2xvY2soYXRvbS5rZXltYXBzLmdldFBhcnRpYWxNYXRjaFRpbWVvdXQoKSlcblxubW9kdWxlLmV4cG9ydHMgPSB7Z2V0VmltU3RhdGUsIGdldFZpZXcsIGRpc3BhdGNoLCBUZXh0RGF0YSwgd2l0aE1vY2tQbGF0Zm9ybX1cbiJdfQ==
