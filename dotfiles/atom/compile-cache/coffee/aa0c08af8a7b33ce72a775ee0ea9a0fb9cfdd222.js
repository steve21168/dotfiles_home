(function() {
  var Motion, Search, SearchBackwards, SearchBase, SearchCurrentWord, SearchCurrentWordBackwards, SearchModel, _, getNonWordCharactersForCursor, ref, saveEditorState, searchByProjectFind,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('./utils'), saveEditorState = ref.saveEditorState, getNonWordCharactersForCursor = ref.getNonWordCharactersForCursor, searchByProjectFind = ref.searchByProjectFind;

  SearchModel = require('./search-model');

  Motion = require('./base').getClass('Motion');

  SearchBase = (function(superClass) {
    extend(SearchBase, superClass);

    function SearchBase() {
      return SearchBase.__super__.constructor.apply(this, arguments);
    }

    SearchBase.extend(false);

    SearchBase.prototype.jump = true;

    SearchBase.prototype.backwards = false;

    SearchBase.prototype.useRegexp = true;

    SearchBase.prototype.caseSensitivityKind = null;

    SearchBase.prototype.landingPoint = null;

    SearchBase.prototype.defaultLandingPoint = 'start';

    SearchBase.prototype.relativeIndex = null;

    SearchBase.prototype.updatelastSearchPattern = true;

    SearchBase.prototype.isBackwards = function() {
      return this.backwards;
    };

    SearchBase.prototype.isIncrementalSearch = function() {
      return this["instanceof"]('Search') && !this.repeated && this.getConfig('incrementalSearch');
    };

    SearchBase.prototype.initialize = function() {
      SearchBase.__super__.initialize.apply(this, arguments);
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.finish();
        };
      })(this));
    };

    SearchBase.prototype.getCount = function() {
      var count;
      count = SearchBase.__super__.getCount.apply(this, arguments);
      if (this.isBackwards()) {
        return -count;
      } else {
        return count;
      }
    };

    SearchBase.prototype.finish = function() {
      var ref1;
      if (this.isIncrementalSearch() && this.getConfig('showHoverSearchCounter')) {
        this.vimState.hoverSearchCounter.reset();
      }
      this.relativeIndex = null;
      if ((ref1 = this.searchModel) != null) {
        ref1.destroy();
      }
      return this.searchModel = null;
    };

    SearchBase.prototype.getLandingPoint = function() {
      return this.landingPoint != null ? this.landingPoint : this.landingPoint = this.defaultLandingPoint;
    };

    SearchBase.prototype.getPoint = function(cursor) {
      var point, range;
      if (this.searchModel != null) {
        this.relativeIndex = this.getCount() + this.searchModel.getRelativeIndex();
      } else {
        if (this.relativeIndex == null) {
          this.relativeIndex = this.getCount();
        }
      }
      if (range = this.search(cursor, this.input, this.relativeIndex)) {
        point = range[this.getLandingPoint()];
      }
      this.searchModel.destroy();
      this.searchModel = null;
      return point;
    };

    SearchBase.prototype.moveCursor = function(cursor) {
      var input, point;
      input = this.input;
      if (!input) {
        return;
      }
      if (point = this.getPoint(cursor)) {
        cursor.setBufferPosition(point, {
          autoscroll: false
        });
      }
      if (!this.repeated) {
        this.globalState.set('currentSearch', this);
        this.vimState.searchHistory.save(input);
      }
      if (this.updatelastSearchPattern) {
        return this.globalState.set('lastSearchPattern', this.getPattern(input));
      }
    };

    SearchBase.prototype.getSearchModel = function() {
      return this.searchModel != null ? this.searchModel : this.searchModel = new SearchModel(this.vimState, {
        incrementalSearch: this.isIncrementalSearch()
      });
    };

    SearchBase.prototype.search = function(cursor, input, relativeIndex) {
      var fromPoint, searchModel;
      searchModel = this.getSearchModel();
      if (input) {
        fromPoint = this.getBufferPositionForCursor(cursor);
        return searchModel.search(fromPoint, this.getPattern(input), relativeIndex);
      } else {
        this.vimState.hoverSearchCounter.reset();
        return searchModel.clearMarkers();
      }
    };

    return SearchBase;

  })(Motion);

  Search = (function(superClass) {
    extend(Search, superClass);

    function Search() {
      this.handleConfirmSearch = bind(this.handleConfirmSearch, this);
      return Search.__super__.constructor.apply(this, arguments);
    }

    Search.extend();

    Search.prototype.caseSensitivityKind = "Search";

    Search.prototype.requireInput = true;

    Search.prototype.initialize = function() {
      Search.__super__.initialize.apply(this, arguments);
      if (this.isComplete()) {
        return;
      }
      if (this.isIncrementalSearch()) {
        this.restoreEditorState = saveEditorState(this.editor);
        this.onDidCommandSearch(this.handleCommandEvent.bind(this));
      }
      this.onDidConfirmSearch(this.handleConfirmSearch.bind(this));
      this.onDidCancelSearch(this.handleCancelSearch.bind(this));
      this.onDidChangeSearch(this.handleChangeSearch.bind(this));
      return this.focusSearchInputEditor();
    };

    Search.prototype.focusSearchInputEditor = function() {
      var classList;
      classList = [];
      if (this.backwards) {
        classList.push('backwards');
      }
      return this.vimState.searchInput.focus({
        classList: classList
      });
    };

    Search.prototype.handleCommandEvent = function(commandEvent) {
      var direction, input, operation;
      if (!commandEvent.input) {
        return;
      }
      switch (commandEvent.name) {
        case 'visit':
          direction = commandEvent.direction;
          if (this.isBackwards() && this.getConfig('incrementalSearchVisitDirection') === 'relative') {
            direction = (function() {
              switch (direction) {
                case 'next':
                  return 'prev';
                case 'prev':
                  return 'next';
              }
            })();
          }
          switch (direction) {
            case 'next':
              return this.getSearchModel().visit(+1);
            case 'prev':
              return this.getSearchModel().visit(-1);
          }
          break;
        case 'occurrence':
          operation = commandEvent.operation, input = commandEvent.input;
          this.vimState.occurrenceManager.addPattern(this.getPattern(input), {
            reset: operation != null
          });
          this.vimState.occurrenceManager.saveLastPattern();
          this.vimState.searchHistory.save(input);
          this.vimState.searchInput.cancel();
          if (operation != null) {
            return this.vimState.operationStack.run(operation);
          }
          break;
        case 'project-find':
          input = commandEvent.input;
          this.vimState.searchHistory.save(input);
          this.vimState.searchInput.cancel();
          return searchByProjectFind(this.editor, input);
      }
    };

    Search.prototype.handleCancelSearch = function() {
      var ref1;
      if ((ref1 = this.mode) !== 'visual' && ref1 !== 'insert') {
        this.vimState.resetNormalMode();
      }
      if (typeof this.restoreEditorState === "function") {
        this.restoreEditorState();
      }
      this.vimState.reset();
      return this.finish();
    };

    Search.prototype.isSearchRepeatCharacter = function(char) {
      var searchChar;
      if (this.isIncrementalSearch()) {
        return char === '';
      } else {
        searchChar = this.isBackwards() ? '?' : '/';
        return char === '' || char === searchChar;
      }
    };

    Search.prototype.handleConfirmSearch = function(arg) {
      this.input = arg.input, this.landingPoint = arg.landingPoint;
      if (this.isSearchRepeatCharacter(this.input)) {
        this.input = this.vimState.searchHistory.get('prev');
        if (!this.input) {
          atom.beep();
        }
      }
      return this.processOperation();
    };

    Search.prototype.handleChangeSearch = function(input) {
      if (input.startsWith(' ')) {
        input = input.replace(/^ /, '');
        this.useRegexp = false;
      }
      this.vimState.searchInput.updateOptionSettings({
        useRegexp: this.useRegexp
      });
      if (this.isIncrementalSearch()) {
        return this.search(this.editor.getLastCursor(), input, this.getCount());
      }
    };

    Search.prototype.getPattern = function(term) {
      var modifiers;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      if (term.indexOf('\\c') >= 0) {
        term = term.replace('\\c', '');
        if (indexOf.call(modifiers, 'i') < 0) {
          modifiers += 'i';
        }
      }
      if (this.useRegexp) {
        try {
          return new RegExp(term, modifiers);
        } catch (error) {
          null;
        }
      }
      return new RegExp(_.escapeRegExp(term), modifiers);
    };

    return Search;

  })(SearchBase);

  SearchBackwards = (function(superClass) {
    extend(SearchBackwards, superClass);

    function SearchBackwards() {
      return SearchBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchBackwards.extend();

    SearchBackwards.prototype.backwards = true;

    return SearchBackwards;

  })(Search);

  SearchCurrentWord = (function(superClass) {
    extend(SearchCurrentWord, superClass);

    function SearchCurrentWord() {
      return SearchCurrentWord.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWord.extend();

    SearchCurrentWord.prototype.caseSensitivityKind = "SearchCurrentWord";

    SearchCurrentWord.prototype.moveCursor = function(cursor) {
      var wordRange;
      if (this.input == null) {
        this.input = (wordRange = this.getCurrentWordBufferRange(), wordRange != null ? (this.editor.setCursorBufferPosition(wordRange.start), this.editor.getTextInBufferRange(wordRange)) : '');
      }
      return SearchCurrentWord.__super__.moveCursor.apply(this, arguments);
    };

    SearchCurrentWord.prototype.getPattern = function(term) {
      var modifiers, pattern;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      pattern = _.escapeRegExp(term);
      if (/\W/.test(term)) {
        return new RegExp(pattern + "\\b", modifiers);
      } else {
        return new RegExp("\\b" + pattern + "\\b", modifiers);
      }
    };

    SearchCurrentWord.prototype.getCurrentWordBufferRange = function() {
      var cursor, found, nonWordCharacters, point, wordRegex;
      cursor = this.editor.getLastCursor();
      point = cursor.getBufferPosition();
      nonWordCharacters = getNonWordCharactersForCursor(cursor);
      wordRegex = new RegExp("[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+", 'g');
      found = null;
      this.scanForward(wordRegex, {
        from: [point.row, 0],
        allowNextLine: false
      }, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThan(point)) {
          found = range;
          return stop();
        }
      });
      return found;
    };

    return SearchCurrentWord;

  })(SearchBase);

  SearchCurrentWordBackwards = (function(superClass) {
    extend(SearchCurrentWordBackwards, superClass);

    function SearchCurrentWordBackwards() {
      return SearchCurrentWordBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWordBackwards.extend();

    SearchCurrentWordBackwards.prototype.backwards = true;

    return SearchCurrentWordBackwards;

  })(SearchCurrentWord);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL3N0ZXZlZ29vZHN0ZWluLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21vdGlvbi1zZWFyY2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxvTEFBQTtJQUFBOzs7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosTUFBd0UsT0FBQSxDQUFRLFNBQVIsQ0FBeEUsRUFBQyxxQ0FBRCxFQUFrQixpRUFBbEIsRUFBaUQ7O0VBQ2pELFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBQ2QsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsUUFBbEIsQ0FBMkIsUUFBM0I7O0VBRUg7Ozs7Ozs7SUFDSixVQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O3lCQUNBLElBQUEsR0FBTTs7eUJBQ04sU0FBQSxHQUFXOzt5QkFDWCxTQUFBLEdBQVc7O3lCQUNYLG1CQUFBLEdBQXFCOzt5QkFDckIsWUFBQSxHQUFjOzt5QkFDZCxtQkFBQSxHQUFxQjs7eUJBQ3JCLGFBQUEsR0FBZTs7eUJBQ2YsdUJBQUEsR0FBeUI7O3lCQUV6QixXQUFBLEdBQWEsU0FBQTthQUNYLElBQUMsQ0FBQTtJQURVOzt5QkFHYixtQkFBQSxHQUFxQixTQUFBO2FBQ25CLElBQUMsRUFBQSxVQUFBLEVBQUQsQ0FBWSxRQUFaLENBQUEsSUFBMEIsQ0FBSSxJQUFDLENBQUEsUUFBL0IsSUFBNEMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxtQkFBWDtJQUR6Qjs7eUJBR3JCLFVBQUEsR0FBWSxTQUFBO01BQ1YsNENBQUEsU0FBQTthQUNBLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ3BCLEtBQUMsQ0FBQSxNQUFELENBQUE7UUFEb0I7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRCO0lBRlU7O3lCQUtaLFFBQUEs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LFNBQUMsR0FBRDtBQUNwRSxZQUFBO1FBRHNFLG1CQUFPO1FBQzdFLElBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFWLENBQXdCLEtBQXhCLENBQUg7VUFDRSxLQUFBLEdBQVE7aUJBQ1IsSUFBQSxDQUFBLEVBRkY7O01BRG9FLENBQXRFO2FBSUE7SUFaeUI7Ozs7S0F2Qkc7O0VBcUMxQjs7Ozs7OztJQUNKLDBCQUFDLENBQUEsTUFBRCxDQUFBOzt5Q0FDQSxTQUFBLEdBQVc7Ozs7S0FGNEI7QUFyT3pDIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxue3NhdmVFZGl0b3JTdGF0ZSwgZ2V0Tm9uV29yZENoYXJhY3RlcnNGb3JDdXJzb3IsIHNlYXJjaEJ5UHJvamVjdEZpbmR9ID0gcmVxdWlyZSAnLi91dGlscydcblNlYXJjaE1vZGVsID0gcmVxdWlyZSAnLi9zZWFyY2gtbW9kZWwnXG5Nb3Rpb24gPSByZXF1aXJlKCcuL2Jhc2UnKS5nZXRDbGFzcygnTW90aW9uJylcblxuY2xhc3MgU2VhcmNoQmFzZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBqdW1wOiB0cnVlXG4gIGJhY2t3YXJkczogZmFsc2VcbiAgdXNlUmVnZXhwOiB0cnVlXG4gIGNhc2VTZW5zaXRpdml0eUtpbmQ6IG51bGxcbiAgbGFuZGluZ1BvaW50OiBudWxsICMgWydzdGFydCcgb3IgJ2VuZCddXG4gIGRlZmF1bHRMYW5kaW5nUG9pbnQ6ICdzdGFydCcgIyBbJ3N0YXJ0JyBvciAnZW5kJ11cbiAgcmVsYXRpdmVJbmRleDogbnVsbFxuICB1cGRhdGVsYXN0U2VhcmNoUGF0dGVybjogdHJ1ZVxuXG4gIGlzQmFja3dhcmRzOiAtPlxuICAgIEBiYWNrd2FyZHNcblxuICBpc0luY3JlbWVudGFsU2VhcmNoOiAtPlxuICAgIEBpbnN0YW5jZW9mKCdTZWFyY2gnKSBhbmQgbm90IEByZXBlYXRlZCBhbmQgQGdldENvbmZpZygnaW5jcmVtZW50YWxTZWFyY2gnKVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIEBmaW5pc2goKVxuXG4gIGdldENvdW50OiAtPlxuICAgIGNvdW50ID0gc3VwZXJcbiAgICBpZiBAaXNCYWNrd2FyZHMoKVxuICAgICAgLWNvdW50XG4gICAgZWxzZVxuICAgICAgY291bnRcblxuICBmaW5pc2g6IC0+XG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKSBhbmQgQGdldENvbmZpZygnc2hvd0hvdmVyU2VhcmNoQ291bnRlcicpXG4gICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLnJlc2V0KClcbiAgICBAcmVsYXRpdmVJbmRleCA9IG51bGxcbiAgICBAc2VhcmNoTW9kZWw/LmRlc3Ryb3koKVxuICAgIEBzZWFyY2hNb2RlbCA9IG51bGxcblxuICBnZXRMYW5kaW5nUG9pbnQ6IC0+XG4gICAgQGxhbmRpbmdQb2ludCA/PSBAZGVmYXVsdExhbmRpbmdQb2ludFxuXG4gIGdldFBvaW50OiAoY3Vyc29yKSAtPlxuICAgIGlmIEBzZWFyY2hNb2RlbD9cbiAgICAgIEByZWxhdGl2ZUluZGV4ID0gQGdldENvdW50KCkgKyBAc2VhcmNoTW9kZWwuZ2V0UmVsYXRpdmVJbmRleCgpXG4gICAgZWxzZVxuICAgICAgQHJlbGF0aXZlSW5kZXggPz0gQGdldENvdW50KClcblxuICAgIGlmIHJhbmdlID0gQHNlYXJjaChjdXJzb3IsIEBpbnB1dCwgQHJlbGF0aXZlSW5kZXgpXG4gICAgICBwb2ludCA9IHJhbmdlW0BnZXRMYW5kaW5nUG9pbnQoKV1cblxuICAgIEBzZWFyY2hNb2RlbC5kZXN0cm95KClcbiAgICBAc2VhcmNoTW9kZWwgPSBudWxsXG5cbiAgICBwb2ludFxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaW5wdXQgPSBAaW5wdXRcbiAgICByZXR1cm4gdW5sZXNzIGlucHV0XG5cbiAgICBpZiBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IpXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQsIGF1dG9zY3JvbGw6IGZhbHNlKVxuXG4gICAgdW5sZXNzIEByZXBlYXRlZFxuICAgICAgQGdsb2JhbFN0YXRlLnNldCgnY3VycmVudFNlYXJjaCcsIHRoaXMpXG4gICAgICBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5zYXZlKGlucHV0KVxuXG4gICAgaWYgQHVwZGF0ZWxhc3RTZWFyY2hQYXR0ZXJuXG4gICAgICBAZ2xvYmFsU3RhdGUuc2V0KCdsYXN0U2VhcmNoUGF0dGVybicsIEBnZXRQYXR0ZXJuKGlucHV0KSlcblxuICBnZXRTZWFyY2hNb2RlbDogLT5cbiAgICBAc2VhcmNoTW9kZWwgPz0gbmV3IFNlYXJjaE1vZGVsKEB2aW1TdGF0ZSwgaW5jcmVtZW50YWxTZWFyY2g6IEBpc0luY3JlbWVudGFsU2VhcmNoKCkpXG5cbiAgc2VhcmNoOiAoY3Vyc29yLCBpbnB1dCwgcmVsYXRpdmVJbmRleCkgLT5cbiAgICBzZWFyY2hNb2RlbCA9IEBnZXRTZWFyY2hNb2RlbCgpXG4gICAgaWYgaW5wdXRcbiAgICAgIGZyb21Qb2ludCA9IEBnZXRCdWZmZXJQb3NpdGlvbkZvckN1cnNvcihjdXJzb3IpXG4gICAgICByZXR1cm4gc2VhcmNoTW9kZWwuc2VhcmNoKGZyb21Qb2ludCwgQGdldFBhdHRlcm4oaW5wdXQpLCByZWxhdGl2ZUluZGV4KVxuICAgIGVsc2VcbiAgICAgIEB2aW1TdGF0ZS5ob3ZlclNlYXJjaENvdW50ZXIucmVzZXQoKVxuICAgICAgc2VhcmNoTW9kZWwuY2xlYXJNYXJrZXJzKClcblxuIyAvLCA/XG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNlYXJjaCBleHRlbmRzIFNlYXJjaEJhc2VcbiAgQGV4dGVuZCgpXG4gIGNhc2VTZW5zaXRpdml0eUtpbmQ6IFwiU2VhcmNoXCJcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIHJldHVybiBpZiBAaXNDb21wbGV0ZSgpICMgV2hlbiByZXBlYXRlZCwgbm8gbmVlZCB0byBnZXQgdXNlciBpbnB1dFxuXG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKVxuICAgICAgQHJlc3RvcmVFZGl0b3JTdGF0ZSA9IHNhdmVFZGl0b3JTdGF0ZShAZWRpdG9yKVxuICAgICAgQG9uRGlkQ29tbWFuZFNlYXJjaChAaGFuZGxlQ29tbWFuZEV2ZW50LmJpbmQodGhpcykpXG5cbiAgICBAb25EaWRDb25maXJtU2VhcmNoKEBoYW5kbGVDb25maXJtU2VhcmNoLmJpbmQodGhpcykpXG4gICAgQG9uRGlkQ2FuY2VsU2VhcmNoKEBoYW5kbGVDYW5jZWxTZWFyY2guYmluZCh0aGlzKSlcbiAgICBAb25EaWRDaGFuZ2VTZWFyY2goQGhhbmRsZUNoYW5nZVNlYXJjaC5iaW5kKHRoaXMpKVxuXG4gICAgQGZvY3VzU2VhcmNoSW5wdXRFZGl0b3IoKVxuXG4gIGZvY3VzU2VhcmNoSW5wdXRFZGl0b3I6IC0+XG4gICAgY2xhc3NMaXN0ID0gW11cbiAgICBjbGFzc0xpc3QucHVzaCgnYmFja3dhcmRzJykgaWYgQGJhY2t3YXJkc1xuICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5mb2N1cyh7Y2xhc3NMaXN0fSlcblxuICBoYW5kbGVDb21tYW5kRXZlbnQ6IChjb21tYW5kRXZlbnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBjb21tYW5kRXZlbnQuaW5wdXRcbiAgICBzd2l0Y2ggY29tbWFuZEV2ZW50Lm5hbWVcbiAgICAgIHdoZW4gJ3Zpc2l0J1xuICAgICAgICB7ZGlyZWN0aW9ufSA9IGNvbW1hbmRFdmVudFxuICAgICAgICBpZiBAaXNCYWNrd2FyZHMoKSBhbmQgQGdldENvbmZpZygnaW5jcmVtZW50YWxTZWFyY2hWaXNpdERpcmVjdGlvbicpIGlzICdyZWxhdGl2ZSdcbiAgICAgICAgICBkaXJlY3Rpb24gPSBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgICAgICAgICB3aGVuICduZXh0JyB0aGVuICdwcmV2J1xuICAgICAgICAgICAgd2hlbiAncHJldicgdGhlbiAnbmV4dCdcblxuICAgICAgICBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgICAgICAgd2hlbiAnbmV4dCcgdGhlbiBAZ2V0U2VhcmNoTW9kZWwoKS52aXNpdCgrMSlcbiAgICAgICAgICB3aGVuICdwcmV2JyB0aGVuIEBnZXRTZWFyY2hNb2RlbCgpLnZpc2l0KC0xKVxuXG4gICAgICB3aGVuICdvY2N1cnJlbmNlJ1xuICAgICAgICB7b3BlcmF0aW9uLCBpbnB1dH0gPSBjb21tYW5kRXZlbnRcbiAgICAgICAgQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4oQGdldFBhdHRlcm4oaW5wdXQpLCByZXNldDogb3BlcmF0aW9uPylcbiAgICAgICAgQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLnNhdmVMYXN0UGF0dGVybigpXG5cbiAgICAgICAgQHZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZShpbnB1dClcbiAgICAgICAgQHZpbVN0YXRlLnNlYXJjaElucHV0LmNhbmNlbCgpXG5cbiAgICAgICAgQHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bihvcGVyYXRpb24pIGlmIG9wZXJhdGlvbj9cblxuICAgICAgd2hlbiAncHJvamVjdC1maW5kJ1xuICAgICAgICB7aW5wdXR9ID0gY29tbWFuZEV2ZW50XG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnNhdmUoaW5wdXQpXG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKVxuICAgICAgICBzZWFyY2hCeVByb2plY3RGaW5kKEBlZGl0b3IsIGlucHV0KVxuXG4gIGhhbmRsZUNhbmNlbFNlYXJjaDogLT5cbiAgICBAdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKCkgdW5sZXNzIEBtb2RlIGluIFsndmlzdWFsJywgJ2luc2VydCddXG4gICAgQHJlc3RvcmVFZGl0b3JTdGF0ZT8oKVxuICAgIEB2aW1TdGF0ZS5yZXNldCgpXG4gICAgQGZpbmlzaCgpXG5cbiAgaXNTZWFyY2hSZXBlYXRDaGFyYWN0ZXI6IChjaGFyKSAtPlxuICAgIGlmIEBpc0luY3JlbWVudGFsU2VhcmNoKClcbiAgICAgIGNoYXIgaXMgJydcbiAgICBlbHNlXG4gICAgICBzZWFyY2hDaGFyID0gaWYgQGlzQmFja3dhcmRzKCkgdGhlbiAnPycgZWxzZSAnLydcbiAgICAgIGNoYXIgaW4gWycnLCBzZWFyY2hDaGFyXVxuXG4gIGhhbmRsZUNvbmZpcm1TZWFyY2g6ICh7QGlucHV0LCBAbGFuZGluZ1BvaW50fSkgPT5cbiAgICBpZiBAaXNTZWFyY2hSZXBlYXRDaGFyYWN0ZXIoQGlucHV0KVxuICAgICAgQGlucHV0ID0gQHZpbVN0YXRlLnNlYXJjaEhpc3RvcnkuZ2V0KCdwcmV2JylcbiAgICAgIGF0b20uYmVlcCgpIHVubGVzcyBAaW5wdXRcbiAgICBAcHJvY2Vzc09wZXJhdGlvbigpXG5cbiAgaGFuZGxlQ2hhbmdlU2VhcmNoOiAoaW5wdXQpIC0+XG4gICAgIyBJZiBpbnB1dCBzdGFydHMgd2l0aCBzcGFjZSwgcmVtb3ZlIGZpcnN0IHNwYWNlIGFuZCBkaXNhYmxlIHVzZVJlZ2V4cC5cbiAgICBpZiBpbnB1dC5zdGFydHNXaXRoKCcgJylcbiAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvXiAvLCAnJylcbiAgICAgIEB1c2VSZWdleHAgPSBmYWxzZVxuICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC51cGRhdGVPcHRpb25TZXR0aW5ncyh7QHVzZVJlZ2V4cH0pXG5cbiAgICBpZiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpXG4gICAgICBAc2VhcmNoKEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLCBpbnB1dCwgQGdldENvdW50KCkpXG5cbiAgZ2V0UGF0dGVybjogKHRlcm0pIC0+XG4gICAgbW9kaWZpZXJzID0gaWYgQGlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSB0aGVuICdnJyBlbHNlICdnaSdcbiAgICAjIEZJWE1FIHRoaXMgcHJldmVudCBzZWFyY2ggXFxcXGMgaXRzZWxmLlxuICAgICMgRE9OVCB0aGlua2xlc3NseSBtaW1pYyBwdXJlIFZpbS4gSW5zdGVhZCwgcHJvdmlkZSBpZ25vcmVjYXNlIGJ1dHRvbiBhbmQgc2hvcnRjdXQuXG4gICAgaWYgdGVybS5pbmRleE9mKCdcXFxcYycpID49IDBcbiAgICAgIHRlcm0gPSB0ZXJtLnJlcGxhY2UoJ1xcXFxjJywgJycpXG4gICAgICBtb2RpZmllcnMgKz0gJ2knIHVubGVzcyAnaScgaW4gbW9kaWZpZXJzXG5cbiAgICBpZiBAdXNlUmVnZXhwXG4gICAgICB0cnlcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodGVybSwgbW9kaWZpZXJzKVxuICAgICAgY2F0Y2hcbiAgICAgICAgbnVsbFxuXG4gICAgbmV3IFJlZ0V4cChfLmVzY2FwZVJlZ0V4cCh0ZXJtKSwgbW9kaWZpZXJzKVxuXG5jbGFzcyBTZWFyY2hCYWNrd2FyZHMgZXh0ZW5kcyBTZWFyY2hcbiAgQGV4dGVuZCgpXG4gIGJhY2t3YXJkczogdHJ1ZVxuXG4jICosICNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU2VhcmNoQ3VycmVudFdvcmQgZXh0ZW5kcyBTZWFyY2hCYXNlXG4gIEBleHRlbmQoKVxuICBjYXNlU2Vuc2l0aXZpdHlLaW5kOiBcIlNlYXJjaEN1cnJlbnRXb3JkXCJcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBpbnB1dCA/PSAoXG4gICAgICB3b3JkUmFuZ2UgPSBAZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgICBpZiB3b3JkUmFuZ2U/XG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24od29yZFJhbmdlLnN0YXJ0KVxuICAgICAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSlcbiAgICAgIGVsc2VcbiAgICAgICAgJydcbiAgICApXG4gICAgc3VwZXJcblxuICBnZXRQYXR0ZXJuOiAodGVybSkgLT5cbiAgICBtb2RpZmllcnMgPSBpZiBAaXNDYXNlU2Vuc2l0aXZlKHRlcm0pIHRoZW4gJ2cnIGVsc2UgJ2dpJ1xuICAgIHBhdHRlcm4gPSBfLmVzY2FwZVJlZ0V4cCh0ZXJtKVxuICAgIGlmIC9cXFcvLnRlc3QodGVybSlcbiAgICAgIG5ldyBSZWdFeHAoXCIje3BhdHRlcm59XFxcXGJcIiwgbW9kaWZpZXJzKVxuICAgIGVsc2VcbiAgICAgIG5ldyBSZWdFeHAoXCJcXFxcYiN7cGF0dGVybn1cXFxcYlwiLCBtb2RpZmllcnMpXG5cbiAgZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZTogLT5cbiAgICBjdXJzb3IgPSBAZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gZ2V0Tm9uV29yZENoYXJhY3RlcnNGb3JDdXJzb3IoY3Vyc29yKVxuICAgIHdvcmRSZWdleCA9IG5ldyBSZWdFeHAoXCJbXlxcXFxzI3tfLmVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XStcIiwgJ2cnKVxuXG4gICAgZm91bmQgPSBudWxsXG4gICAgQHNjYW5Gb3J3YXJkIHdvcmRSZWdleCwge2Zyb206IFtwb2ludC5yb3csIDBdLCBhbGxvd05leHRMaW5lOiBmYWxzZX0sICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4ocG9pbnQpXG4gICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgZm91bmRcblxuY2xhc3MgU2VhcmNoQ3VycmVudFdvcmRCYWNrd2FyZHMgZXh0ZW5kcyBTZWFyY2hDdXJyZW50V29yZFxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmRzOiB0cnVlXG4iXX0=
