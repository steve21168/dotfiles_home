(function() {
  var Base, CSON, Delegato, OperationAbortedError, VMP_LOADED_FILES, VMP_LOADING_FILE, __plus, _plus, getEditorState, loadVmpOperationFile, path, ref, selectList, settings, vimStateMethods,
    slice = [].slice,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  __plus = null;

  _plus = function() {
    return __plus != null ? __plus : __plus = require('underscore-plus');
  };

  Delegato = require('delegato');

  settings = require('./settings');

  ref = [], CSON = ref[0], path = ref[1], selectList = ref[2], getEditorState = ref[3];

  VMP_LOADING_FILE = null;

  VMP_LOADED_FILES = [];

  loadVmpOperationFile = function(filename) {
    var vmpLoadingFileOriginal;
    vmpLoadingFileOriginal = VMP_LOADING_FILE;
    VMP_LOADING_FILE = filename;
    require(filename);
    VMP_LOADING_FILE = vmpLoadingFileOriginal;
    return VMP_LOADED_FILES.push(filename);
  };

  OperationAbortedError = null;

  vimStateMethods = ["onDidChangeSearch", "onDidConfirmSearch", "onDidCancelSearch", "onDidCommandSearch", "onDidSetTarget", "emitDidSetTarget", "onWillSelectTarget", "emitWillSelectTarget", "onDidSelectTarget", "emitDidSelectTarget", "onDidFailSelectTarget", "emitDidFailSelectTarget", "onWillFinishMutation", "emitWillFinishMutation", "onDidFinishMutation", "emitDidFinishMutation", "onDidFinishOperation", "onDidResetOperationStack", "onDidSetOperatorModifier", "onWillActivateMode", "onDidActivateMode", "preemptWillDeactivateMode", "onWillDeactivateMode", "onDidDeactivateMode", "onDidCancelSelectList", "subscribe", "isMode", "getBlockwiseSelections", "getLastBlockwiseSelection", "addToClassList", "getConfig"];

  Base = (function() {
    var classRegistry;

    Delegato.includeInto(Base);

    Base.delegatesMethods.apply(Base, slice.call(vimStateMethods).concat([{
      toProperty: 'vimState'
    }]));

    Base.delegatesProperty('mode', 'submode', 'swrap', 'utils', {
      toProperty: 'vimState'
    });

    function Base(vimState1, properties) {
      var ref1;
      this.vimState = vimState1;
      if (properties == null) {
        properties = null;
      }
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement, this.globalState = ref1.globalState, this.swrap = ref1.swrap;
      this.name = this.constructor.name;
      if (properties != null) {
        Object.assign(this, properties);
      }
    }

    Base.prototype.initialize = function() {};

    Base.prototype.isComplete = function() {
      var ref1;
      if (this.requireInput && (this.input == null)) {
        return false;
      } else if (this.requireTarget) {
        return (ref1 = this.target) != null ? typeof ref1.isComplete === "function" ? ref1.isComplete() : void 0 : void 0;
      } else {
        return true;
      }
    };

    Base.prototype.requireTarget = false;

    Base.prototype.requireInput = false;

    Base.prototype.recordable = false;

    Base.prototype.repeated = false;

    Base.prototype.target = null;

    Base.prototype.operator = null;

    Base.prototype.isAsTargetExceptSelect = function() {
      return (this.operator != null) && !this.operator["instanceof"]('Select');
    };

    Base.prototype.abort = function() {
      if (OperationAbortedError == null) {
        OperationAbortedError = require('./errors');
      }
      throw new OperationAbortedError('aborted');
    };

    Base.prototype.count = null;

    Base.prototype.defaultCount = 1;

    Base.prototype.getCount = function(offset) {
      var ref1;
      if (offset == null) {
        offset = 0;
      }
      if (this.count == null) {
        this.count = (ref1 = this.vimState.getCount()) != null ? ref1 : this.defaultCount;
      }
      return this.count + offset;
    };

    Base.prototype.resetCount = function() {
      return this.count = null;
    };

    Base.prototype.isDefaultCount = function() {
      return this.count === this.defaultCount;
    };

    Base.prototype.countTimes = function(last, fn) {
      var count, i, isFinal, ref1, results, stop, stopped;
      if (last < 1) {
        return;
      }
      stopped = false;
      stop = function() {
        return stopped = true;
      };
      results = [];
      for (count = i = 1, ref1 = last; 1 <= ref1 ? i <= ref1 : i >= ref1; count = 1 <= ref1 ? ++i : --i) {
        isFinal = count === last;
        fn({
          count: count,
          isFinal: isFinal,
          stop: stop
        });
        if (stopped) {
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Base.prototype.activateMode = function(mode, submode) {
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.vimState.activate(mode, submode);
        };
      })(this));
    };

    Base.prototype.activateModeIfNecessary = function(mode, submode) {
      if (!this.vimState.isMode(mode, submode)) {
        return this.activateMode(mode, submode);
      }
    };

    Base.prototype["new"] = function(name, properties) {
      var klass;
      klass = Base.getClass(name);
      return new klass(this.vimState, properties);
    };

    Base.prototype.clone = function(vimState) {
      var excludeProperties, key, klass, properties, ref1, value;
      properties = {};
      excludeProperties = ['editor', 'editorElement', 'globalState', 'vimState', 'operator'];
      ref1 = this;
      for (key in ref1) {
        if (!hasProp.call(ref1, key)) continue;
        value = ref1[key];
        if (indexOf.call(excludeProperties, key) < 0) {
          properties[key] = value;
        }
      }
      klass = this.constructor;
      return new klass(vimState, properties);
    };

    Base.prototype.cancelOperation = function() {
      return this.vimState.operationStack.cancel();
    };

    Base.prototype.processOperation = function() {
      return this.vimState.operationStack.process();
    };

    Base.prototype.focusSelectList = function(options) {
      if (options == null) {
        options = {};
      }
      this.onDidCancelSelectList((function(_this) {
        return function() {
          return _this.cancelOperation();
        };
      })(this));
      if (selectList == null) {
        selectList = new (require('./select-list'));
      }
      return selectList.show(this.vimState, options);
    };

    Base.prototype.input = null;

    Base.prototype.focusInput = function(options) {
      if (options == null) {
        options = {};
      }
      if (options.onConfirm == null) {
        options.onConfirm = (function(_this) {
          return function(input1) {
            _this.input = input1;
            return _this.processOperation();
          };
        })(this);
      }
      if (options.onCancel == null) {
        options.onCancel = (function(_this) {
          return function() {
            return _this.cancelOperation();
          };
        })(this);
      }
      if (options.onChange == null) {
        options.onChange = (function(_this) {
          return function(input) {
            return _this.vimState.hover.set(input);
          };
        })(this);
      }
      return this.vimState.focusInput(options);
    };

    Base.prototype.readChar = function() {
      return this.vimState.readChar({
        onConfirm: (function(_this) {
          return function(input1) {
            _this.input = input1;
            return _this.processOperation();
          };
        })(this),
        onCancel: (function(_this) {
          return function() {
            return _this.cancelOperation();
          };
        })(this)
      });
    };

    Base.prototype.getVimEofBufferPosition = function() {
      return this.utils.getVimEofBufferPosition(this.editor);
    };

    Base.prototype.getVimLastBufferRow = function() {
      return this.utils.getVimLastBufferRow(this.editor);
    };

    Base.prototype.getVimLastScreenRow = function() {
      return this.utils.getVimLastScreenRow(this.editor);
    };

    Base.prototype.getWordBufferRangeAndKindAtBufferPosition = function(point, options) {
      return this.utils.getWordBufferRangeAndKindAtBufferPosition(this.editor, point, options);
    };

    Base.prototype.getFirstCharacterPositionForBufferRow = function(row) {
      return this.utils.getFirstCharacterPositionForBufferRow(this.editor, row);
    };

    Base.prototype.getBufferRangeForRowRange = function(rowRange) {
      return this.utils.getBufferRangeForRowRange(this.editor, rowRange);
    };

    Base.prototype.getIndentLevelForBufferRow = function(row) {
      return this.utils.getIndentLevelForBufferRow(this.editor, row);
    };

    Base.prototype.scanForward = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.utils).scanEditorInDirection.apply(ref1, [this.editor, 'forward'].concat(slice.call(args)));
    };

    Base.prototype.scanBackward = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.utils).scanEditorInDirection.apply(ref1, [this.editor, 'backward'].concat(slice.call(args)));
    };

    Base.prototype.getFoldEndRowForRow = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.utils).getFoldEndRowForRow.apply(ref1, [this.editor].concat(slice.call(args)));
    };

    Base.prototype["instanceof"] = function(klassName) {
      return this instanceof Base.getClass(klassName);
    };

    Base.prototype.is = function(klassName) {
      return this.constructor === Base.getClass(klassName);
    };

    Base.prototype.isOperator = function() {
      return this.constructor.operationKind === 'operator';
    };

    Base.prototype.isMotion = function() {
      return this.constructor.operationKind === 'motion';
    };

    Base.prototype.isTextObject = function() {
      return this.constructor.operationKind === 'text-object';
    };

    Base.prototype.getCursorBufferPosition = function() {
      if (this.mode === 'visual') {
        return this.getCursorPositionForSelection(this.editor.getLastSelection());
      } else {
        return this.editor.getCursorBufferPosition();
      }
    };

    Base.prototype.getCursorBufferPositions = function() {
      if (this.mode === 'visual') {
        return this.editor.getSelections().map(this.getCursorPositionForSelection.bind(this));
      } else {
        return this.editor.getCursorBufferPositions();
      }
    };

    Base.prototype.getBufferPositionForCursor = function(cursor) {
      if (this.mode === 'visual') {
        return this.getCursorPositionForSelection(cursor.selection);
      } else {
        return cursor.getBufferPosition();
      }
    };

    Base.prototype.getCursorPositionForSelection = function(selection) {
      return this.swrap(selection).getBufferPositionFor('head', {
        from: ['property', 'selection']
      });
    };

    Base.prototype.toString = function() {
      var str;
      str = this.name;
      if (this.target != null) {
        return str += ", target=" + this.target.name + ", target.wise=" + this.target.wise + " ";
      } else if (this.operator != null) {
        return str += ", wise=" + this.wise + " , operator=" + this.operator.name;
      } else {
        return str;
      }
    };

    Base.writeCommandTableOnDisk = function() {
      var _, commandTable, commandTablePath, loadableCSONText;
      commandTable = this.generateCommandTableByEagerLoad();
      _ = _plus();
      if (_.isEqual(this.commandTable, commandTable)) {
        atom.notifications.addInfo("No change commandTable", {
          dismissable: true
        });
        return;
      }
      if (CSON == null) {
        CSON = require('season');
      }
      if (path == null) {
        path = require('path');
      }
      loadableCSONText = "# This file is auto generated by `vim-mode-plus:write-command-table-on-disk` command.\n# DONT edit manually.\nmodule.exports =\n" + (CSON.stringify(commandTable)) + "\n";
      commandTablePath = path.join(__dirname, "command-table.coffee");
      return atom.workspace.open(commandTablePath).then(function(editor) {
        editor.setText(loadableCSONText);
        editor.save();
        return atom.notifications.addInfo("Updated commandTable", {
          dismissable: true
        });
      });
    };

    Base.generateCommandTableByEagerLoad = function() {
      var _, commandTable, file, filesToLoad, i, j, klass, klasses, klassesGroupedByFile, len, len1, ref1;
      filesToLoad = ['./operator', './operator-insert', './operator-transform-string', './motion', './motion-search', './text-object', './misc-command'];
      filesToLoad.forEach(loadVmpOperationFile);
      _ = _plus();
      klasses = _.values(this.getClassRegistry());
      klassesGroupedByFile = _.groupBy(klasses, function(klass) {
        return klass.VMP_LOADING_FILE;
      });
      commandTable = {};
      for (i = 0, len = filesToLoad.length; i < len; i++) {
        file = filesToLoad[i];
        ref1 = klassesGroupedByFile[file];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          klass = ref1[j];
          commandTable[klass.name] = klass.getSpec();
        }
      }
      return commandTable;
    };

    Base.commandTable = null;

    Base.init = function(_getEditorState) {
      var name, ref1, spec, subscriptions;
      getEditorState = _getEditorState;
      this.commandTable = require('./command-table');
      subscriptions = [];
      ref1 = this.commandTable;
      for (name in ref1) {
        spec = ref1[name];
        if (spec.commandName != null) {
          subscriptions.push(this.registerCommandFromSpec(name, spec));
        }
      }
      return subscriptions;
    };

    classRegistry = {
      Base: Base
    };

    Base.extend = function(command1) {
      this.command = command1 != null ? command1 : true;
      this.VMP_LOADING_FILE = VMP_LOADING_FILE;
      if (this.name in classRegistry) {
        console.warn("Duplicate constructor " + this.name);
      }
      return classRegistry[this.name] = this;
    };

    Base.getSpec = function() {
      if (this.isCommand()) {
        return {
          file: this.VMP_LOADING_FILE,
          commandName: this.getCommandName(),
          commandScope: this.getCommandScope()
        };
      } else {
        return {
          file: this.VMP_LOADING_FILE
        };
      }
    };

    Base.getClass = function(name) {
      var fileToLoad, klass;
      if ((klass = classRegistry[name])) {
        return klass;
      }
      fileToLoad = this.commandTable[name].file;
      if (indexOf.call(VMP_LOADED_FILES, fileToLoad) < 0) {
        if (atom.inDevMode() && settings.get('debug')) {
          console.log("lazy-require: " + fileToLoad + " for " + name);
        }
        loadVmpOperationFile(fileToLoad);
        if ((klass = classRegistry[name])) {
          return klass;
        }
      }
      throw new Error("class '" + name + "' not found");
    };

    Base.getClassRegistry = function() {
      return classRegistry;
    };

    Base.isCommand = function() {
      return this.command;
    };

    Base.commandPrefix = 'vim-mode-plus';

    Base.getCommandName = function() {
      return this.commandPrefix + ':' + _plus().dasherize(this.name);
    };

    Base.getCommandNameWithoutPrefix = function() {
      return _plus().dasherize(this.name);
    };

    Base.commandScope = 'atom-text-editor';

    Base.getCommandScope = function() {
      return this.commandScope;
    };

    Base.getDesctiption = function() {
      if (this.hasOwnProperty("description")) {
        return this.description;
      } else {
        return null;
      }
    };

    Base.registerCommand = function() {
      var klass;
      klass = this;
      return atom.commands.add(this.getCommandScope(), this.getCommandName(), function(event) {
        var ref1, vimState;
        vimState = (ref1 = getEditorState(this.getModel())) != null ? ref1 : getEditorState(atom.workspace.getActiveTextEditor());
        if (vimState != null) {
          vimState.operationStack.run(klass);
        }
        return event.stopPropagation();
      });
    };

    Base.registerCommandFromSpec = function(name, spec) {
      var commandName, commandPrefix, commandScope, getClass;
      commandScope = spec.commandScope, commandPrefix = spec.commandPrefix, commandName = spec.commandName, getClass = spec.getClass;
      if (commandScope == null) {
        commandScope = 'atom-text-editor';
      }
      if (commandName == null) {
        commandName = (commandPrefix != null ? commandPrefix : 'vim-mode-plus') + ':' + _plus().dasherize(name);
      }
      return atom.commands.add(commandScope, commandName, function(event) {
        var ref1, vimState;
        vimState = (ref1 = getEditorState(this.getModel())) != null ? ref1 : getEditorState(atom.workspace.getActiveTextEditor());
        if (vimState != null) {
          if (getClass != null) {
            vimState.operationStack.run(getClass(name));
          } else {
            vimState.operationStack.run(name);
          }
        }
        return event.stopPropagation();
      });
    };

    Base.operationKind = null;

    Base.getKindForCommandName = function(command) {
      var _, name;
      command = command.replace(/^vim-mode-plus:/, "");
      _ = _plus();
      name = _.capitalize(_.camelize(command));
      if (name in classRegistry) {
        return classRegistry[name].operationKind;
      }
    };

    return Base;

  })();

  module.exports = Base;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL3N0ZXZlZ29vZHN0ZWluLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL2Jhc2UuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQSxzTEFBQTtJQUFBOzs7O0VBQUEsTUFBQSxHQUFTOztFQUNULEtBQUEsR0FBUSxTQUFBOzRCQUNOLFNBQUEsU0FBVSxPQUFBLENBQVEsaUJBQVI7RUFESjs7RUFHUixRQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0VBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BS0ksRUFMSixFQUNFLGFBREYsRUFFRSxhQUZGLEVBR0UsbUJBSEYsRUFJRTs7RUFHRixnQkFBQSxHQUFtQjs7RUFDbkIsZ0JBQUEsR0FBbUI7O0VBRW5CLG9CQUFBLEdBQXVCLFNBQUMsUUFBRDtBQUtyQixRQUFBO0lBQUEsc0JBQUEsR0FBeUI7SUFDekIsZ0JBQUEsR0FBbUI7SUFDbkIsT0FBQSxDQUFRLFFBQVI7SUFDQSxnQkFBQSxHQUFtQjtXQUVuQixnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQixRQUF0QjtFQVZxQjs7RUFZdkIscUJBQUEsR0FBd0I7O0VBRXhCLGVBQUEsR0FBa0IsQ0FDaEIsbUJBRGdCLEVBRWhCLG9CQUZnQixFQUdoQixtQkFIZ0IsRUFJaEIsb0JBSmdCLEVBT2hCLGdCQVBnQixFQU9FLGtCQVBGLEVBUWQsb0JBUmMsRUFRUSxzQkFSUixFQVNkLG1CQVRjLEVBU08scUJBVFAsRUFVZCx1QkFWYyxFQVVXLHlCQVZYLEVBWWQsc0JBWmMsRUFZVSx3QkFaVixFQWFkLHFCQWJjLEVBYVMsdUJBYlQsRUFjaEIsc0JBZGdCLEVBZWhCLDBCQWZnQixFQWlCaEIsMEJBakJnQixFQW1CaEIsb0JBbkJnQixFQW9CaEIsbUJBcEJnQixFQXFCaEIsMkJBckJnQixFQXNCaEIsc0JBdEJnQixFQXVCaEIscUJBdkJnQixFQXlCaEIsdUJB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QSxDQUFTLElBQVQsQ0FBNUIsRUFERjtXQUFBLE1BQUE7WUFHRSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQXhCLENBQTRCLElBQTVCLEVBSEY7V0FERjs7ZUFLQSxLQUFLLENBQUMsZUFBTixDQUFBO01BUDJDLENBQTdDO0lBSndCOztJQWMxQixJQUFDLENBQUEsYUFBRCxHQUFnQjs7SUFDaEIsSUFBQyxDQUFBLHFCQUFELEdBQXdCLFNBQUMsT0FBRDtBQUN0QixVQUFBO01BQUEsT0FBQSxHQUFVLE9BQU8sQ0FBQyxPQUFSLENBQWdCLGlCQUFoQixFQUFtQyxFQUFuQztNQUNWLENBQUEsR0FBSSxLQUFBLENBQUE7TUFDSixJQUFBLEdBQU8sQ0FBQyxDQUFDLFVBQUYsQ0FBYSxDQUFDLENBQUMsUUFBRixDQUFXLE9BQVgsQ0FBYjtNQUNQLElBQUcsSUFBQSxJQUFRLGFBQVg7ZUFDRSxhQUFjLENBQUEsSUFBQSxDQUFLLENBQUMsY0FEdEI7O0lBSnNCOzs7Ozs7RUFPMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUEvWGpCIiwic291cmNlc0NvbnRlbnQiOlsiIyBUbyBhdm9pZCBsb2FkaW5nIHVuZGVyc2NvcmUtcGx1cyBhbmQgZGVwZW5kaW5nIHVuZGVyc2NvcmUgb24gc3RhcnR1cFxuX19wbHVzID0gbnVsbFxuX3BsdXMgPSAtPlxuICBfX3BsdXMgPz0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5EZWxlZ2F0byA9IHJlcXVpcmUgJ2RlbGVnYXRvJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuXG5bXG4gIENTT05cbiAgcGF0aFxuICBzZWxlY3RMaXN0XG4gIGdldEVkaXRvclN0YXRlICAjIHNldCBieSBCYXNlLmluaXQoKVxuXSA9IFtdICMgc2V0IG51bGxcblxuVk1QX0xPQURJTkdfRklMRSA9IG51bGxcblZNUF9MT0FERURfRklMRVMgPSBbXVxuXG5sb2FkVm1wT3BlcmF0aW9uRmlsZSA9IChmaWxlbmFtZSkgLT5cbiAgIyBDYWxsIHRvIGxvYWRWbXBPcGVyYXRpb25GaWxlIGNhbiBiZSBuZXN0ZWQuXG4gICMgMS4gcmVxdWlyZShcIi4vb3BlcmF0b3ItdHJhbnNmb3JtLXN0cmluZ1wiKVxuICAjIDIuIGluIG9wZXJhdG9yLXRyYW5zZm9ybS1zdHJpbmcuY29mZmVlIGNhbGwgQmFzZS5nZXRDbGFzcyhcIk9wZXJhdG9yXCIpIGNhdXNlIG9wZXJhdG9yLmNvZmZlZSByZXF1aXJlZC5cbiAgIyBTbyB3ZSBoYXZlIHRvIHNhdmUgb3JpZ2luYWwgVk1QX0xPQURJTkdfRklMRSBhbmQgcmVzdG9yZSBpdCBhZnRlciByZXF1aXJlIGZpbmlzaGVkLlxuICB2bXBMb2FkaW5nRmlsZU9yaWdpbmFsID0gVk1QX0xPQURJTkdfRklMRVxuICBWTVBfTE9BRElOR19GSUxFID0gZmlsZW5hbWVcbiAgcmVxdWlyZShmaWxlbmFtZSlcbiAgVk1QX0xPQURJTkdfRklMRSA9IHZtcExvYWRpbmdGaWxlT3JpZ2luYWxcblxuICBWTVBfTE9BREVEX0ZJTEVTLnB1c2goZmlsZW5hbWUpXG5cbk9wZXJhdGlvbkFib3J0ZWRFcnJvciA9IG51bGxcblxudmltU3RhdGVNZXRob2RzID0gW1xuICBcIm9uRGlkQ2hhbmdlU2VhcmNoXCJcbiAgXCJvbkRpZENvbmZpcm1TZWFyY2hcIlxuICBcIm9uRGlkQ2FuY2VsU2VhcmNoXCJcbiAgXCJvbkRpZENvbW1hbmRTZWFyY2hcIlxuXG4gICMgTGlmZSBjeWNsZSBvZiBvcGVyYXRpb25TdGFja1xuICBcIm9uRGlkU2V0VGFyZ2V0XCIsIFwiZW1pdERpZFNldFRhcmdldFwiXG4gICAgXCJvbldpbGxTZWxlY3RUYXJnZXRcIiwgXCJlbWl0V2lsbFNlbGVjdFRhcmdldFwiXG4gICAgXCJvbkRpZFNlbGVjdFRhcmdldFwiLCBcImVtaXREaWRTZWxlY3RUYXJnZXRcIlxuICAgIFwib25EaWRGYWlsU2VsZWN0VGFyZ2V0XCIsIFwiZW1pdERpZEZhaWxTZWxlY3RUYXJnZXRcIlxuXG4gICAgXCJvbldpbGxGaW5pc2hNdXRhdGlvblwiLCBcImVtaXRXaWxsRmluaXNoTXV0YXRpb25cIlxuICAgIFwib25EaWRGaW5pc2hNdXRhdGlvblwiLCBcImVtaXREaWRGaW5pc2hNdXRhdGlvblwiXG4gIFwib25EaWRGaW5pc2hPcGVyYXRpb25cIlxuICBcIm9uRGlkUmVzZXRPcGVyYXRpb25TdGFja1wiXG5cbiAgXCJvbkRpZFNldE9wZXJhdG9yTW9kaWZpZXJcIlxuXG4gIFwib25XaWxsQWN0aXZhdGVNb2RlXCJcbiAgXCJvbkRpZEFjdGl2YXRlTW9kZVwiXG4gIFwicHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZVwiXG4gIFwib25XaWxsRGVhY3RpdmF0ZU1vZGVcIlxuICBcIm9uRGlkRGVhY3RpdmF0ZU1vZGVcIlxuXG4gIFwib25EaWRDYW5jZWxTZWxlY3RMaXN0XCJcbiAgXCJzdWJzY3JpYmVcIlxuICBcImlzTW9kZVwiXG4gIFwiZ2V0QmxvY2t3aXNlU2VsZWN0aW9uc1wiXG4gIFwiZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvblwiXG4gIFwiYWRkVG9DbGFzc0xpc3RcIlxuICBcImdldENvbmZpZ1wiXG5dXG5cbmNsYXNzIEJhc2VcbiAgRGVsZWdhdG8uaW5jbHVkZUludG8odGhpcylcbiAgQGRlbGVnYXRlc01ldGhvZHModmltU3RhdGVNZXRob2RzLi4uLCB0b1Byb3BlcnR5OiAndmltU3RhdGUnKVxuICBAZGVsZWdhdGVzUHJvcGVydHkoJ21vZGUnLCAnc3VibW9kZScsICdzd3JhcCcsICd1dGlscycsIHRvUHJvcGVydHk6ICd2aW1TdGF0ZScpXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUsIHByb3BlcnRpZXM9bnVsbCkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBnbG9iYWxTdGF0ZSwgQHN3cmFwfSA9IEB2aW1TdGF0ZVxuICAgIEBuYW1lID0gQGNvbnN0cnVjdG9yLm5hbWVcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIHByb3BlcnRpZXMpIGlmIHByb3BlcnRpZXM/XG5cbiAgIyBUbyBvdmVycmlkZVxuICBpbml0aWFsaXplOiAtPlxuXG4gICMgT3BlcmF0aW9uIHByb2Nlc3NvciBleGVjdXRlIG9ubHkgd2hlbiBpc0NvbXBsZXRlKCkgcmV0dXJuIHRydWUuXG4gICMgSWYgZmFsc2UsIG9wZXJhdGlvbiBwcm9jZXNzb3IgcG9zdHBvbmUgaXRzIGV4ZWN1dGlvbi5cbiAgaXNDb21wbGV0ZTogLT5cbiAgICBpZiBAcmVxdWlyZUlucHV0IGFuZCBub3QgQGlucHV0P1xuICAgICAgZmFsc2VcbiAgICBlbHNlIGlmIEByZXF1aXJlVGFyZ2V0XG4gICAgICAjIFdoZW4gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaW4gQmFzZTo6Y29uc3RydWN0b3JcbiAgICAgICMgdGFnZXJ0IGlzIHN0aWxsIHN0cmluZyBsaWtlIGBNb3ZlVG9SaWdodGAsIGluIHRoaXMgY2FzZSBpc0NvbXBsZXRlXG4gICAgICAjIGlzIG5vdCBhdmFpbGFibGUuXG4gICAgICBAdGFyZ2V0Py5pc0NvbXBsZXRlPygpXG4gICAgZWxzZVxuICAgICAgdHJ1ZVxuXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIHJlcXVpcmVJbnB1dDogZmFsc2VcbiAgcmVjb3JkYWJsZTogZmFsc2VcbiAgcmVwZWF0ZWQ6IGZhbHNlXG4gIHRhcmdldDogbnVsbCAjIFNldCBpbiBPcGVyYXRvclxuICBvcGVyYXRvcjogbnVsbCAjIFNldCBpbiBvcGVyYXRvcidzIHRhcmdldCggTW90aW9uIG9yIFRleHRPYmplY3QgKVxuICBpc0FzVGFyZ2V0RXhjZXB0U2VsZWN0OiAtPlxuICAgIEBvcGVyYXRvcj8gYW5kIG5vdCBAb3BlcmF0b3IuaW5zdGFuY2VvZignU2VsZWN0JylcblxuICBhYm9ydDogLT5cbiAgICBPcGVyYXRpb25BYm9ydGVkRXJyb3IgPz0gcmVxdWlyZSAnLi9lcnJvcnMnXG4gICAgdGhyb3cgbmV3IE9wZXJhdGlvbkFib3J0ZWRFcnJvcignYWJvcnRlZCcpXG5cbiAgIyBDb3VudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY291bnQ6IG51bGxcbiAgZGVmYXVsdENvdW50OiAxXG4gIGdldENvdW50OiAob2Zmc2V0PTApIC0+XG4gICAgQGNvdW50ID89IEB2aW1TdGF0ZS5nZXRDb3VudCgpID8gQGRlZmF1bHRDb3VudFxuICAgIEBjb3VudCArIG9mZnNldFxuXG4gIHJlc2V0Q291bnQ6IC0+XG4gICAgQGNvdW50ID0gbnVsbFxuXG4gIGlzRGVmYXVsdENvdW50OiAtPlxuICAgIEBjb3VudCBpcyBAZGVmYXVsdENvdW50XG5cbiAgIyBNaXNjXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb3VudFRpbWVzOiAobGFzdCwgZm4pIC0+XG4gICAgcmV0dXJuIGlmIGxhc3QgPCAxXG5cbiAgICBzdG9wcGVkID0gZmFsc2VcbiAgICBzdG9wID0gLT4gc3RvcHBlZCA9IHRydWVcbiAgICBmb3IgY291bnQgaW4gWzEuLmxhc3RdXG4gICAgICBpc0ZpbmFsID0gY291bnQgaXMgbGFzdFxuICAgICAgZm4oe2NvdW50LCBpc0ZpbmFsLCBzdG9wfSlcbiAgICAgIGJyZWFrIGlmIHN0b3BwZWRcblxuICBhY3RpdmF0ZU1vZGU6IChtb2RlLCBzdWJtb2RlKSAtPlxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgQHZpbVN0YXRlLmFjdGl2YXRlKG1vZGUsIHN1Ym1vZGUpXG5cbiAgYWN0aXZhdGVNb2RlSWZOZWNlc3Nhcnk6IChtb2RlLCBzdWJtb2RlKSAtPlxuICAgIHVubGVzcyBAdmltU3RhdGUuaXNNb2RlKG1vZGUsIHN1Ym1vZGUpXG4gICAgICBAYWN0aXZhdGVNb2RlKG1vZGUsIHN1Ym1vZGUpXG5cbiAgbmV3OiAobmFtZSwgcHJvcGVydGllcykgLT5cbiAgICBrbGFzcyA9IEJhc2UuZ2V0Q2xhc3MobmFtZSlcbiAgICBuZXcga2xhc3MoQHZpbVN0YXRlLCBwcm9wZXJ0aWVzKVxuXG4gICMgRklYTUU6IFRoaXMgaXMgdXNlZCB0byBjbG9uZSBNb3Rpb246OlNlYXJjaCB0byBzdXBwb3J0IGBuYCBhbmQgYE5gXG4gICMgQnV0IG1hbnVhbCByZXNldGluZyBhbmQgb3ZlcnJpZGluZyBwcm9wZXJ0eSBpcyBidWcgcHJvbmUuXG4gICMgU2hvdWxkIGV4dHJhY3QgYXMgc2VhcmNoIHNwZWMgb2JqZWN0IGFuZCB1c2UgaXQgYnlcbiAgIyBjcmVhdGluZyBjbGVhbiBpbnN0YW5jZSBvZiBTZWFyY2guXG4gIGNsb25lOiAodmltU3RhdGUpIC0+XG4gICAgcHJvcGVydGllcyA9IHt9XG4gICAgZXhjbHVkZVByb3BlcnRpZXMgPSBbJ2VkaXRvcicsICdlZGl0b3JFbGVtZW50JywgJ2dsb2JhbFN0YXRlJywgJ3ZpbVN0YXRlJywgJ29wZXJhdG9yJ11cbiAgICBmb3Igb3duIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleSBub3QgaW4gZXhjbHVkZVByb3BlcnRpZXNcbiAgICAgIHByb3BlcnRpZXNba2V5XSA9IHZhbHVlXG4gICAga2xhc3MgPSB0aGlzLmNvbnN0cnVjdG9yXG4gICAgbmV3IGtsYXNzKHZpbVN0YXRlLCBwcm9wZXJ0aWVzKVxuXG4gIGNhbmNlbE9wZXJhdGlvbjogLT5cbiAgICBAdmltU3RhdGUub3BlcmF0aW9uU3RhY2suY2FuY2VsKClcblxuICBwcm9jZXNzT3BlcmF0aW9uOiAtPlxuICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5wcm9jZXNzKClcblxuICBmb2N1c1NlbGVjdExpc3Q6IChvcHRpb25zPXt9KSAtPlxuICAgIEBvbkRpZENhbmNlbFNlbGVjdExpc3QgPT5cbiAgICAgIEBjYW5jZWxPcGVyYXRpb24oKVxuICAgIHNlbGVjdExpc3QgPz0gbmV3IChyZXF1aXJlICcuL3NlbGVjdC1saXN0JylcbiAgICBzZWxlY3RMaXN0LnNob3coQHZpbVN0YXRlLCBvcHRpb25zKVxuXG4gIGlucHV0OiBudWxsXG4gIGZvY3VzSW5wdXQ6IChvcHRpb25zID0ge30pIC0+XG4gICAgb3B0aW9ucy5vbkNvbmZpcm0gPz0gKEBpbnB1dCkgPT4gQHByb2Nlc3NPcGVyYXRpb24oKVxuICAgIG9wdGlvbnMub25DYW5jZWwgPz0gPT4gQGNhbmNlbE9wZXJhdGlvbigpXG4gICAgb3B0aW9ucy5vbkNoYW5nZSA/PSAoaW5wdXQpID0+IEB2aW1TdGF0ZS5ob3Zlci5zZXQoaW5wdXQpXG4gICAgQHZpbVN0YXRlLmZvY3VzSW5wdXQob3B0aW9ucylcblxuICByZWFkQ2hhcjogLT5cbiAgICBAdmltU3RhdGUucmVhZENoYXJcbiAgICAgIG9uQ29uZmlybTogKEBpbnB1dCkgPT4gQHByb2Nlc3NPcGVyYXRpb24oKVxuICAgICAgb25DYW5jZWw6ID0+IEBjYW5jZWxPcGVyYXRpb24oKVxuXG4gIGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEB1dGlscy5nZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbihAZWRpdG9yKVxuXG4gIGdldFZpbUxhc3RCdWZmZXJSb3c6IC0+XG4gICAgQHV0aWxzLmdldFZpbUxhc3RCdWZmZXJSb3coQGVkaXRvcilcblxuICBnZXRWaW1MYXN0U2NyZWVuUm93OiAtPlxuICAgIEB1dGlscy5nZXRWaW1MYXN0U2NyZWVuUm93KEBlZGl0b3IpXG5cbiAgZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb246IChwb2ludCwgb3B0aW9ucykgLT5cbiAgICBAdXRpbHMuZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24oQGVkaXRvciwgcG9pbnQsIG9wdGlvbnMpXG5cbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdzogKHJvdykgLT5cbiAgICBAdXRpbHMuZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhAZWRpdG9yLCByb3cpXG5cbiAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZTogKHJvd1JhbmdlKSAtPlxuICAgIEB1dGlscy5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIHJvd1JhbmdlKVxuXG4gIGdldEluZGVudExldmVsRm9yQnVmZmVyUm93OiAocm93KSAtPlxuICAgIEB1dGlscy5nZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCByb3cpXG5cbiAgc2NhbkZvcndhcmQ6IChhcmdzLi4uKSAtPlxuICAgIEB1dGlscy5zY2FuRWRpdG9ySW5EaXJlY3Rpb24oQGVkaXRvciwgJ2ZvcndhcmQnLCBhcmdzLi4uKVxuXG4gIHNjYW5CYWNrd2FyZDogKGFyZ3MuLi4pIC0+XG4gICAgQHV0aWxzLnNjYW5FZGl0b3JJbkRpcmVjdGlvbihAZWRpdG9yLCAnYmFja3dhcmQnLCBhcmdzLi4uKVxuXG4gIGdldEZvbGRFbmRSb3dGb3JSb3c6IChhcmdzLi4uKSAtPlxuICAgIEB1dGlscy5nZXRGb2xkRW5kUm93Rm9yUm93KEBlZGl0b3IsIGFyZ3MuLi4pXG5cbiAgaW5zdGFuY2VvZjogKGtsYXNzTmFtZSkgLT5cbiAgICB0aGlzIGluc3RhbmNlb2YgQmFzZS5nZXRDbGFzcyhrbGFzc05hbWUpXG5cbiAgaXM6IChrbGFzc05hbWUpIC0+XG4gICAgdGhpcy5jb25zdHJ1Y3RvciBpcyBCYXNlLmdldENsYXNzKGtsYXNzTmFtZSlcblxuICBpc09wZXJhdG9yOiAtPlxuICAgIEBjb25zdHJ1Y3Rvci5vcGVyYXRpb25LaW5kIGlzICdvcGVyYXRvcidcblxuICBpc01vdGlvbjogLT5cbiAgICBAY29uc3RydWN0b3Iub3BlcmF0aW9uS2luZCBpcyAnbW90aW9uJ1xuXG4gIGlzVGV4dE9iamVjdDogLT5cbiAgICBAY29uc3RydWN0b3Iub3BlcmF0aW9uS2luZCBpcyAndGV4dC1vYmplY3QnXG5cbiAgZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb246IC0+XG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcblxuICBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnM6IC0+XG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLm1hcChAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24uYmluZCh0aGlzKSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9ucygpXG5cbiAgZ2V0QnVmZmVyUG9zaXRpb25Gb3JDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihjdXJzb3Iuc2VsZWN0aW9uKVxuICAgIGVsc2VcbiAgICAgIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgQHN3cmFwKHNlbGVjdGlvbikuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ2hlYWQnLCBmcm9tOiBbJ3Byb3BlcnR5JywgJ3NlbGVjdGlvbiddKVxuXG4gIHRvU3RyaW5nOiAtPlxuICAgIHN0ciA9IEBuYW1lXG4gICAgaWYgQHRhcmdldD9cbiAgICAgIHN0ciArPSBcIiwgdGFyZ2V0PSN7QHRhcmdldC5uYW1lfSwgdGFyZ2V0Lndpc2U9I3tAdGFyZ2V0Lndpc2V9IFwiXG4gICAgZWxzZSBpZiBAb3BlcmF0b3I/XG4gICAgICBzdHIgKz0gXCIsIHdpc2U9I3tAd2lzZX0gLCBvcGVyYXRvcj0je0BvcGVyYXRvci5uYW1lfVwiXG4gICAgZWxzZVxuICAgICAgc3RyXG5cbiAgIyBDbGFzcyBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAd3JpdGVDb21tYW5kVGFibGVPbkRpc2s6IC0+XG4gICAgY29tbWFuZFRhYmxlID0gQGdlbmVyYXRlQ29tbWFuZFRhYmxlQnlFYWdlckxvYWQoKVxuICAgIF8gPSBfcGx1cygpXG4gICAgaWYgXy5pc0VxdWFsKEBjb21tYW5kVGFibGUsIGNvbW1hbmRUYWJsZSlcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiTm8gY2hhbmdlIGNvbW1hbmRUYWJsZVwiLCBkaXNtaXNzYWJsZTogdHJ1ZSlcbiAgICAgIHJldHVyblxuXG4gICAgQ1NPTiA/PSByZXF1aXJlICdzZWFzb24nXG4gICAgcGF0aCA/PSByZXF1aXJlKCdwYXRoJylcblxuICAgIGxvYWRhYmxlQ1NPTlRleHQgPSBcIlwiXCJcbiAgICAgICMgVGhpcyBmaWxlIGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IGB2aW0tbW9kZS1wbHVzOndyaXRlLWNvbW1hbmQtdGFibGUtb24tZGlza2AgY29tbWFuZC5cbiAgICAgICMgRE9OVCBlZGl0IG1hbnVhbGx5LlxuICAgICAgbW9kdWxlLmV4cG9ydHMgPVxuICAgICAgI3tDU09OLnN0cmluZ2lmeShjb21tYW5kVGFibGUpfVxcblxuICAgICAgXCJcIlwiXG4gICAgY29tbWFuZFRhYmxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiY29tbWFuZC10YWJsZS5jb2ZmZWVcIilcbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGNvbW1hbmRUYWJsZVBhdGgpLnRoZW4gKGVkaXRvcikgLT5cbiAgICAgIGVkaXRvci5zZXRUZXh0KGxvYWRhYmxlQ1NPTlRleHQpXG4gICAgICBlZGl0b3Iuc2F2ZSgpXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIlVwZGF0ZWQgY29tbWFuZFRhYmxlXCIsIGRpc21pc3NhYmxlOiB0cnVlKVxuXG4gIEBnZW5lcmF0ZUNvbW1hbmRUYWJsZUJ5RWFnZXJMb2FkOiAtPlxuICAgICMgTk9URTogY2hhbmdpbmcgb3JkZXIgYWZmZWN0cyBvdXRwdXQgb2YgbGliL2NvbW1hbmQtdGFibGUuY29mZmVlXG4gICAgZmlsZXNUb0xvYWQgPSBbXG4gICAgICAnLi9vcGVyYXRvcicsICcuL29wZXJhdG9yLWluc2VydCcsICcuL29wZXJhdG9yLXRyYW5zZm9ybS1zdHJpbmcnLFxuICAgICAgJy4vbW90aW9uJywgJy4vbW90aW9uLXNlYXJjaCcsICcuL3RleHQtb2JqZWN0JywgJy4vbWlzYy1jb21tYW5kJ1xuICAgIF1cbiAgICBmaWxlc1RvTG9hZC5mb3JFYWNoKGxvYWRWbXBPcGVyYXRpb25GaWxlKVxuICAgIF8gPSBfcGx1cygpXG4gICAga2xhc3NlcyA9IF8udmFsdWVzKEBnZXRDbGFzc1JlZ2lzdHJ5KCkpXG4gICAga2xhc3Nlc0dyb3VwZWRCeUZpbGUgPSBfLmdyb3VwQnkoa2xhc3NlcywgKGtsYXNzKSAtPiBrbGFzcy5WTVBfTE9BRElOR19GSUxFKVxuXG4gICAgY29tbWFuZFRhYmxlID0ge31cbiAgICBmb3IgZmlsZSBpbiBmaWxlc1RvTG9hZFxuICAgICAgZm9yIGtsYXNzIGluIGtsYXNzZXNHcm91cGVkQnlGaWxlW2ZpbGVdXG4gICAgICAgIGNvbW1hbmRUYWJsZVtrbGFzcy5uYW1lXSA9IGtsYXNzLmdldFNwZWMoKVxuICAgIGNvbW1hbmRUYWJsZVxuXG4gIEBjb21tYW5kVGFibGU6IG51bGxcbiAgQGluaXQ6IChfZ2V0RWRpdG9yU3RhdGUpIC0+XG4gICAgZ2V0RWRpdG9yU3RhdGUgPSBfZ2V0RWRpdG9yU3RhdGVcbiAgICBAY29tbWFuZFRhYmxlID0gcmVxdWlyZSgnLi9jb21tYW5kLXRhYmxlJylcbiAgICBzdWJzY3JpcHRpb25zID0gW11cbiAgICBmb3IgbmFtZSwgc3BlYyBvZiBAY29tbWFuZFRhYmxlIHdoZW4gc3BlYy5jb21tYW5kTmFtZT9cbiAgICAgIHN1YnNjcmlwdGlvbnMucHVzaChAcmVnaXN0ZXJDb21tYW5kRnJvbVNwZWMobmFtZSwgc3BlYykpXG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbnNcblxuICBjbGFzc1JlZ2lzdHJ5ID0ge0Jhc2V9XG4gIEBleHRlbmQ6IChAY29tbWFuZD10cnVlKSAtPlxuICAgIEBWTVBfTE9BRElOR19GSUxFID0gVk1QX0xPQURJTkdfRklMRVxuICAgIGlmIEBuYW1lIG9mIGNsYXNzUmVnaXN0cnlcbiAgICAgIGNvbnNvbGUud2FybihcIkR1cGxpY2F0ZSBjb25zdHJ1Y3RvciAje0BuYW1lfVwiKVxuICAgIGNsYXNzUmVnaXN0cnlbQG5hbWVdID0gdGhpc1xuXG4gIEBnZXRTcGVjOiAtPlxuICAgIGlmIEBpc0NvbW1hbmQoKVxuICAgICAgZmlsZTogQFZNUF9MT0FESU5HX0ZJTEVcbiAgICAgIGNvbW1hbmROYW1lOiBAZ2V0Q29tbWFuZE5hbWUoKVxuICAgICAgY29tbWFuZFNjb3BlOiBAZ2V0Q29tbWFuZFNjb3BlKClcbiAgICBlbHNlXG4gICAgICBmaWxlOiBAVk1QX0xPQURJTkdfRklMRVxuXG4gIEBnZXRDbGFzczogKG5hbWUpIC0+XG4gICAgcmV0dXJuIGtsYXNzIGlmIChrbGFzcyA9IGNsYXNzUmVnaXN0cnlbbmFtZV0pXG5cbiAgICBmaWxlVG9Mb2FkID0gQGNvbW1hbmRUYWJsZVtuYW1lXS5maWxlXG4gICAgaWYgZmlsZVRvTG9hZCBub3QgaW4gVk1QX0xPQURFRF9GSUxFU1xuICAgICAgaWYgYXRvbS5pbkRldk1vZGUoKSBhbmQgc2V0dGluZ3MuZ2V0KCdkZWJ1ZycpXG4gICAgICAgIGNvbnNvbGUubG9nIFwibGF6eS1yZXF1aXJlOiAje2ZpbGVUb0xvYWR9IGZvciAje25hbWV9XCJcbiAgICAgIGxvYWRWbXBPcGVyYXRpb25GaWxlKGZpbGVUb0xvYWQpXG4gICAgICByZXR1cm4ga2xhc3MgaWYgKGtsYXNzID0gY2xhc3NSZWdpc3RyeVtuYW1lXSlcblxuICAgIHRocm93IG5ldyBFcnJvcihcImNsYXNzICcje25hbWV9JyBub3QgZm91bmRcIilcblxuICBAZ2V0Q2xhc3NSZWdpc3RyeTogLT5cbiAgICBjbGFzc1JlZ2lzdHJ5XG5cbiAgQGlzQ29tbWFuZDogLT5cbiAgICBAY29tbWFuZFxuXG4gIEBjb21tYW5kUHJlZml4OiAndmltLW1vZGUtcGx1cydcbiAgQGdldENvbW1hbmROYW1lOiAtPlxuICAgIEBjb21tYW5kUHJlZml4ICsgJzonICsgX3BsdXMoKS5kYXNoZXJpemUoQG5hbWUpXG5cbiAgQGdldENvbW1hbmROYW1lV2l0aG91dFByZWZpeDogLT5cbiAgICBfcGx1cygpLmRhc2hlcml6ZShAbmFtZSlcblxuICBAY29tbWFuZFNjb3BlOiAnYXRvbS10ZXh0LWVkaXRvcidcbiAgQGdldENvbW1hbmRTY29wZTogLT5cbiAgICBAY29tbWFuZFNjb3BlXG5cbiAgQGdldERlc2N0aXB0aW9uOiAtPlxuICAgIGlmIEBoYXNPd25Qcm9wZXJ0eShcImRlc2NyaXB0aW9uXCIpXG4gICAgICBAZGVzY3JpcHRpb25cbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgQHJlZ2lzdGVyQ29tbWFuZDogLT5cbiAgICBrbGFzcyA9IHRoaXNcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAZ2V0Q29tbWFuZFNjb3BlKCksIEBnZXRDb21tYW5kTmFtZSgpLCAoZXZlbnQpIC0+XG4gICAgICB2aW1TdGF0ZSA9IGdldEVkaXRvclN0YXRlKEBnZXRNb2RlbCgpKSA/IGdldEVkaXRvclN0YXRlKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIGlmIHZpbVN0YXRlPyAjIFBvc3NpYmx5IHVuZGVmaW5lZCBTZWUgIzg1XG4gICAgICAgIHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bihrbGFzcylcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgQHJlZ2lzdGVyQ29tbWFuZEZyb21TcGVjOiAobmFtZSwgc3BlYykgLT5cbiAgICB7Y29tbWFuZFNjb3BlLCBjb21tYW5kUHJlZml4LCBjb21tYW5kTmFtZSwgZ2V0Q2xhc3N9ID0gc3BlY1xuICAgIGNvbW1hbmRTY29wZSA/PSAnYXRvbS10ZXh0LWVkaXRvcidcbiAgICBjb21tYW5kTmFtZSA/PSAoY29tbWFuZFByZWZpeCA/ICd2aW0tbW9kZS1wbHVzJykgKyAnOicgKyBfcGx1cygpLmRhc2hlcml6ZShuYW1lKVxuICAgIGF0b20uY29tbWFuZHMuYWRkIGNvbW1hbmRTY29wZSwgY29tbWFuZE5hbWUsIChldmVudCkgLT5cbiAgICAgIHZpbVN0YXRlID0gZ2V0RWRpdG9yU3RhdGUoQGdldE1vZGVsKCkpID8gZ2V0RWRpdG9yU3RhdGUoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgaWYgdmltU3RhdGU/ICMgUG9zc2libHkgdW5kZWZpbmVkIFNlZSAjODVcbiAgICAgICAgaWYgZ2V0Q2xhc3M/XG4gICAgICAgICAgdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKGdldENsYXNzKG5hbWUpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKG5hbWUpXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICMgRm9yIGRlbW8tbW9kZSBwa2cgaW50ZWdyYXRpb25cbiAgQG9wZXJhdGlvbktpbmQ6IG51bGxcbiAgQGdldEtpbmRGb3JDb21tYW5kTmFtZTogKGNvbW1hbmQpIC0+XG4gICAgY29tbWFuZCA9IGNvbW1hbmQucmVwbGFjZSgvXnZpbS1tb2RlLXBsdXM6LywgXCJcIilcbiAgICBfID0gX3BsdXMoKVxuICAgIG5hbWUgPSBfLmNhcGl0YWxpemUoXy5jYW1lbGl6ZShjb21tYW5kKSlcbiAgICBpZiBuYW1lIG9mIGNsYXNzUmVnaXN0cnlcbiAgICAgIGNsYXNzUmVnaXN0cnlbbmFtZV0ub3BlcmF0aW9uS2luZFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VcbiJdfQ==
