(function() {
  var TextData, dispatch, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData;

  settings = require('../lib/settings');

  describe("Motion Find", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      settings.set('useExperimentalFasterInput', true);
      return getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
    });
    xdescribe('the f performance', function() {
      var measureWithPerformanceNow, measureWithTimeEnd, timesToExecute;
      timesToExecute = 500;
      measureWithTimeEnd = function(fn) {
        console.time(fn.name);
        fn();
        return console.timeEnd(fn.name);
      };
      measureWithPerformanceNow = function(fn) {
        var t0, t1;
        t0 = performance.now();
        fn();
        t1 = performance.now();
        return console.log("[performance.now] took " + (t1 - t0) + " msec");
      };
      beforeEach(function() {
        return set({
          text: "  " + "l".repeat(timesToExecute),
          cursor: [0, 0]
        });
      });
      xdescribe('the f read-char-via-keybinding performance', function() {
        beforeEach(function() {
          return vimState.useMiniEditor = false;
        });
        return it('[with keybind] moves to l char', function() {
          var testPerformanceOfKeybind;
          testPerformanceOfKeybind = function() {
            var i, n, ref2;
            for (n = i = 1, ref2 = timesToExecute; 1 <= ref2 ? i <= ref2 : i >= ref2; n = 1 <= ref2 ? ++i : --i) {
              keystroke("f l");
            }
            return ensure({
              cursor: [0, timesToExecute + 1]
            });
          };
          console.log("== keybind");
          ensure("f l", {
            cursor: [0, 2]
          });
          set({
            cursor: [0, 0]
          });
          return measureWithTimeEnd(testPerformanceOfKeybind);
        });
      });
      return describe('[with hidden-input] moves to l char', function() {
        return it('[with hidden-input] moves to l char', function() {
          var testPerformanceOfHiddenInput;
          testPerformanceOfHiddenInput = function() {
            var i, n, ref2;
            for (n = i = 1, ref2 = timesToExecute; 1 <= ref2 ? i <= ref2 : i >= ref2; n = 1 <= ref2 ? ++i : --i) {
              keystroke('f l');
            }
            return ensure({
              cursor: [0, timesToExecute + 1]
            });
          };
          console.log("== hidden");
          ensure('f l', {
            cursor: [0, 2]
          });
          set({
            cursor: [0, 0]
          });
          return measureWithTimeEnd(testPerformanceOfHiddenInput);
        });
      });
    });
    describe('the f/F keybindings', function() {
      beforeEach(function() {
        return set({
          text: "abcabcabcabc\n",
          cursor: [0, 0]
        });
      });
      it('moves to the first specified character it finds', function() {
        return ensure('f c', {
          cursor: [0, 2]
        });
      });
      it('extends visual selection in visual-mode and repetable', function() {
        ensure('v', {
          mode: ['visual', 'characterwise']
        });
        ensure('f c', {
          selectedText: 'abc',
          cursor: [0, 3]
        });
        ensure(';', {
          selectedText: 'abcabc',
          cursor: [0, 6]
        });
        return ensure(',', {
          selectedText: 'abc',
          cursor: [0, 3]
        });
      });
      it('moves backwards to the first specified character it finds', function() {
        set({
          cursor: [0, 2]
        });
        return ensure('F a', {
          cursor: [0, 0]
        });
      });
      it('respects count forward', function() {
        return ensure('2 f a', {
          cursor: [0, 6]
        });
      });
      it('respects count backward', function() {
        ({
          cursor: [0, 6]
        });
        return ensure('2 F a', {
          cursor: [0, 0]
        });
      });
      it("doesn't move if the character specified isn't found", function() {
        return ensure('f d', {
          cursor: [0, 0]
        });
      });
      it("doesn't move if there aren't the specified count of the specified character", function() {
        ensure('1 0 f a', {
          cursor: [0, 0]
        });
        ensure('1 1 f a', {
          cursor: [0, 0]
        });
        set({
          cursor: [0, 6]
        });
        ensure('1 0 F a', {
          cursor: [0, 6]
        });
        return ensure('1 1 F a', {
          cursor: [0, 6]
        });
      });
      it("composes with d", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d 2 f a', {
          text: 'abcbc\n'
        });
      });
      return it("F behaves exclusively when composes with operator", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d F a', {
          text: 'abcabcabc\n'
        });
      });
    });
    describe('the t/T keybindings', function() {
      beforeEach(function() {
        return set({
          text: "abcabcabcabc\n",
          cursor: [0, 0]
        });
      });
      it('moves to the character previous to the first specified character it finds', function() {
        ensure('t a', {
          cursor: [0, 2]
        });
        return ensure('t a', {
          cursor: [0, 2]
        });
      });
      it('moves backwards to the character after the first specified character it finds', function() {
        set({
          cursor: [0, 2]
        });
        return ensure('T a', {
          cursor: [0, 1]
        });
      });
      it('respects count forward', function() {
        return ensure('2 t a', {
          cursor: [0, 5]
        });
      });
      it('respects count backward', function() {
        set({
          cursor: [0, 6]
        });
        return ensure('2 T a', {
          cursor: [0, 1]
        });
      });
      it("doesn't move if the character specified isn't found", function() {
        return ensure('t d', {
          cursor: [0, 0]
        });
      });
      it("doesn't move if there aren't the specified count of the specified character", function() {
        ensure('1 0 t d', {
          cursor: [0, 0]
        });
        ensure('1 1 t a', {
          cursor: [0, 0]
        });
        set({
          cursor: [0, 6]
        });
        ensure('1 0 T a', {
          cursor: [0, 6]
        });
        return ensure('1 1 T a', {
          cursor: [0, 6]
        });
      });
      it("composes with d", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d 2 t b', {
          text: 'abcbcabc\n'
        });
      });
      it("delete char under cursor even when no movement happens since it's inclusive motion", function() {
        set({
          cursor: [0, 0]
        });
        return ensure('d t b', {
          text: 'bcabcabcabc\n'
        });
      });
      it("do nothing when inclusiveness inverted by v operator-modifier", function() {
        ({
          text: "abcabcabcabc\n"
        });
        set({
          cursor: [0, 0]
        });
        return ensure('d v t b', {
          text: 'abcabcabcabc\n'
        });
      });
      it("T behaves exclusively when composes with operator", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d T b', {
          text: 'ababcabcabc\n'
        });
      });
      return it("T don't delete character under cursor even when no movement happens", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d T c', {
          text: 'abcabcabcabc\n'
        });
      });
    });
    describe('the ; and , keybindings', function() {
      beforeEach(function() {
        return set({
          text: "abcabcabcabc\n",
          cursor: [0, 0]
        });
      });
      it("repeat f in same direction", function() {
        ensure('f c', {
          cursor: [0, 2]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(';', {
          cursor: [0, 8]
        });
      });
      it("repeat F in same direction", function() {
        set({
          cursor: [0, 10]
        });
        ensure('F c', {
          cursor: [0, 8]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(';', {
          cursor: [0, 2]
        });
      });
      it("repeat f in opposite direction", function() {
        set({
          cursor: [0, 6]
        });
        ensure('f c', {
          cursor: [0, 8]
        });
        ensure(',', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 2]
        });
      });
      it("repeat F in opposite direction", function() {
        set({
          cursor: [0, 4]
        });
        ensure('F c', {
          cursor: [0, 2]
        });
        ensure(',', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 8]
        });
      });
      it("alternate repeat f in same direction and reverse", function() {
        ensure('f c', {
          cursor: [0, 2]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 2]
        });
      });
      it("alternate repeat F in same direction and reverse", function() {
        set({
          cursor: [0, 10]
        });
        ensure('F c', {
          cursor: [0, 8]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 8]
        });
      });
      it("repeat t in same direction", function() {
        ensure('t c', {
          cursor: [0, 1]
        });
        return ensure(';', {
          cursor: [0, 4]
        });
      });
      it("repeat T in same direction", function() {
        set({
          cursor: [0, 10]
        });
        ensure('T c', {
          cursor: [0, 9]
        });
        return ensure(';', {
          cursor: [0, 6]
        });
      });
      it("repeat t in opposite direction first, and then reverse", function() {
        set({
          cursor: [0, 3]
        });
        ensure('t c', {
          cursor: [0, 4]
        });
        ensure(',', {
          cursor: [0, 3]
        });
        return ensure(';', {
          cursor: [0, 4]
        });
      });
      it("repeat T in opposite direction first, and then reverse", function() {
        set({
          cursor: [0, 4]
        });
        ensure('T c', {
          cursor: [0, 3]
        });
        ensure(',', {
          cursor: [0, 4]
        });
        return ensure(';', {
          cursor: [0, 3]
        });
      });
      it("repeat with count in same direction", function() {
        set({
          cursor: [0, 0]
        });
        ensure('f c', {
          cursor: [0, 2]
        });
        return ensure('2 ;', {
          cursor: [0, 8]
        });
      });
      return it("repeat with count in reverse direction", function() {
        set({
          cursor: [0, 6]
        });
        ensure('f c', {
          cursor: [0, 8]
        });
        return ensure('2 ,', {
          cursor: [0, 2]
        });
      });
    });
    describe("last find/till is repeatable on other editor", function() {
      var other, otherEditor, pane, ref2;
      ref2 = [], other = ref2[0], otherEditor = ref2[1], pane = ref2[2];
      beforeEach(function() {
        return getVimState(function(otherVimState, _other) {
          set({
            text: "a baz bar\n",
            cursor: [0, 0]
          });
          other = _other;
          other.set({
            text: "foo bar baz",
            cursor: [0, 0]
          });
          otherEditor = otherVimState.editor;
          pane = atom.workspace.getActivePane();
          return pane.activateItem(editor);
        });
      });
      it("shares the most recent find/till command with other editors", function() {
        ensure('f b', {
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 0]
        });
        pane.activateItem(otherEditor);
        other.keystroke(';');
        ensure({
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 4]
        });
        other.keystroke('t r');
        ensure({
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 5]
        });
        pane.activateItem(editor);
        ensure(';', {
          cursor: [0, 7]
        });
        return other.ensure({
          cursor: [0, 5]
        });
      });
      return it("is still repeatable after original editor was destroyed", function() {
        ensure('f b', {
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 0]
        });
        pane.activateItem(otherEditor);
        editor.destroy();
        expect(editor.isAlive()).toBe(false);
        other.ensure(';', {
          cursor: [0, 4]
        });
        other.ensure(';', {
          cursor: [0, 8]
        });
        return other.ensure(',', {
          cursor: [0, 4]
        });
      });
    });
    return describe("vmp unique feature of `f` family", function() {
      describe("ignoreCaseForFind", function() {
        beforeEach(function() {
          return settings.set("ignoreCaseForFind", true);
        });
        return it("ignore case to find", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f a", {
            textC: "    |A    ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    ab    |a    Ab    a"
          });
          return ensure(";", {
            textC: "    A    ab    a    |Ab    a"
          });
        });
      });
      describe("useSmartcaseForFind", function() {
        beforeEach(function() {
          return settings.set("useSmartcaseForFind", true);
        });
        it("ignore case when input is lower char", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f a", {
            textC: "    |A    ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    ab    |a    Ab    a"
          });
          return ensure(";", {
            textC: "    A    ab    a    |Ab    a"
          });
        });
        return it("find case-sensitively when input is lager char", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f A", {
            textC: "    |A    ab    a    Ab    a"
          });
          ensure("f A", {
            textC: "    A    ab    a    |Ab    a"
          });
          ensure(",", {
            textC: "    |A    ab    a    Ab    a"
          });
          return ensure(";", {
            textC: "    A    ab    a    |Ab    a"
          });
        });
      });
      describe("reuseFindForRepeatFind", function() {
        beforeEach(function() {
          return settings.set("reuseFindForRepeatFind", true);
        });
        return it("can reuse f and t as ;, F and T as ',' respectively", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f a", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure("f", {
            textC: "    A    ab    |a    Ab    a"
          });
          ensure("f", {
            textC: "    A    ab    a    Ab    |a"
          });
          ensure("F", {
            textC: "    A    ab    |a    Ab    a"
          });
          ensure("F", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure("t", {
            textC: "    A    ab   | a    Ab    a"
          });
          ensure("t", {
            textC: "    A    ab    a    Ab   | a"
          });
          ensure("T", {
            textC: "    A    ab    a|    Ab    a"
          });
          return ensure("T", {
            textC: "    A    a|b    a    Ab    a"
          });
        });
      });
      describe("findAcrossLines", function() {
        beforeEach(function() {
          return settings.set("findAcrossLines", true);
        });
        return it("searches across multiple lines", function() {
          set({
            textC: "|0:    a    a\n1:    a    a\n2:    a    a\n"
          });
          ensure("f a", {
            textC: "0:    |a    a\n1:    a    a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    |a\n1:    a    a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    a\n1:    |a    a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    a\n1:    a    |a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    a\n1:    a    a\n2:    |a    a\n"
          });
          ensure("F a", {
            textC: "0:    a    a\n1:    a    |a\n2:    a    a\n"
          });
          ensure("t a", {
            textC: "0:    a    a\n1:    a    a\n2:   | a    a\n"
          });
          ensure("T a", {
            textC: "0:    a    a\n1:    a    |a\n2:    a    a\n"
          });
          return ensure("T a", {
            textC: "0:    a    a\n1:    a|    a\n2:    a    a\n"
          });
        });
      });
      return describe("findCharsMax", function() {
        beforeEach(function() {
          return jasmine.attachToDOM(atom.workspace.getElement());
        });
        describe("with 2 length", function() {
          beforeEach(function() {
            return settings.set("findCharsMax", 2);
          });
          return describe("can find one or two char", function() {
            it("can find by two char", function() {
              set({
                textC: "|    a    ab    a    cd    a"
              });
              ensure("f a b", {
                textC: "    a    |ab    a    cd    a"
              });
              return ensure("f c d", {
                textC: "    a    ab    a    |cd    a"
              });
            });
            return it("can find by one-char by confirming explicitly", function() {
              set({
                textC: "|    a    ab    a    cd    a"
              });
              ensure("f a enter", {
                textC: "    |a    ab    a    cd    a"
              });
              return ensure("f c enter", {
                textC: "    a    ab    a    |cd    a"
              });
            });
          });
        });
        describe("with 3 length", function() {
          beforeEach(function() {
            return settings.set("findCharsMax", 3);
          });
          return describe("can find 3 at maximum", function() {
            return it("can find by one or two or three char", function() {
              set({
                textC: "|    a    ab    a    cd    efg"
              });
              ensure("f a b enter", {
                textC: "    a    |ab    a    cd    efg"
              });
              ensure("f a enter", {
                textC: "    a    ab    |a    cd    efg"
              });
              ensure("f c d enter", {
                textC: "    a    ab    a    |cd    efg"
              });
              return ensure("f e f g", {
                textC: "    a    ab    a    cd    |efg"
              });
            });
          });
        });
        return describe("autoConfirmTimeout", function() {
          beforeEach(function() {
            settings.set("findCharsMax", 2);
            return settings.set("findConfirmByTimeout", 500);
          });
          return it("auto-confirm single-char input on timeout", function() {
            set({
              textC: "|    a    ab    a    cd    a"
            });
            ensure("f a", {
              textC: "|    a    ab    a    cd    a"
            });
            advanceClock(500);
            ensure({
              textC: "    |a    ab    a    cd    a"
            });
            ensure("f c d", {
              textC: "    a    ab    a    |cd    a"
            });
            ensure("f a", {
              textC: "    a    ab    a    |cd    a"
            });
            advanceClock(500);
            ensure({
              textC: "    a    ab    a    cd    |a"
            });
            ensure("F b", {
              textC: "    a    ab    a    cd    |a"
            });
            advanceClock(500);
            return ensure({
              textC: "    a    a|b    a    cd    a"
            });
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL3N0ZXZlZ29vZHN0ZWluLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvc3BlYy9tb3Rpb24tZmluZC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLGVBQVIsQ0FBcEMsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCOztFQUN4QixRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztFQUVYLFFBQUEsQ0FBUyxhQUFULEVBQXdCLFNBQUE7QUFDdEIsUUFBQTtJQUFBLE9BQTRELEVBQTVELEVBQUMsYUFBRCxFQUFNLGdCQUFOLEVBQWMsbUJBQWQsRUFBeUIsZ0JBQXpCLEVBQWlDLHVCQUFqQyxFQUFnRDtJQUVoRCxVQUFBLENBQVcsU0FBQTtNQUNULFFBQVEsQ0FBQyxHQUFULENBQWEsNEJBQWIsRUFBMkMsSUFBM0M7YUFHQSxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsSUFBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixjQUFELEVBQU0sb0JBQU4sRUFBYywwQkFBZCxFQUEyQjtNQUhqQixDQUFaO0lBSlMsQ0FBWDtJQVNBLFNBQUEsQ0FBVSxtQkFBVixFQUErQixTQUFBO0FBQzdCLFVBQUE7TUFBQSxjQUFBLEdBQWlCO01BRWpCLGtCQUFBLEdBQXFCLFNBQUMsRUFBRDtRQUNuQixPQUFPLENBQUMsSUFBUixDQUFhLEVBQUUsQ0FBQyxJQUFoQjtRQUNBLEVBQUEsQ0FBQTtlQUVBLE9BQU8sQ0FBQyxPQUFSLENBQWdCLEVBQUUsQ0FBQyxJQUFuQjtNQUptQjtNQU1yQix5QkFBQSxHQUE0QixTQUFDLEVBQUQ7QUFDMUIsWUFBQTtRQUFBLEVBQUEsR0FBSyxXQUFXLENBQUMsR0FBWixDQUFBO1FBQ0wsRUFBQSxDQUFBO1FBQ0EsRUFBQSxHQUFLLFdBQVcsQ0FBQyxHQUFaLENBQUE7ZUFDTCxP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QUEsQ0FBYSxHQUFiO1lBQ0EsTUFBQSxDQUFnQjtjQUFBLEtBQUEsRUFBTyw4QkFBUDthQUFoQjtZQUVBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO2NBQUEsS0FBQSxFQUFPLDhCQUFQO2FBQWhCO1lBRUEsTUFBQSxDQUFPLEtBQVAsRUFBZ0I7Y0FBQSxLQUFBLEVBQU8sOEJBQVA7YUFBaEI7WUFDQSxZQUFBLENBQWEsR0FBYjtZQUNBLE1BQUEsQ0FBZ0I7Y0FBQSxLQUFBLEVBQU8sOEJBQVA7YUFBaEI7WUFFQSxNQUFBLENBQU8sS0FBUCxFQUFnQjtjQUFBLEtBQUEsRUFBTyw4QkFBUDthQUFoQjtZQUNBLFlBQUEsQ0FBYSxHQUFiO21CQUNBLE1BQUEsQ0FBZ0I7Y0FBQSxLQUFBLEVBQU8sOEJBQVA7YUFBaEI7VUFmOEMsQ0FBaEQ7UUFMNkIsQ0FBL0I7TUFoQ3VCLENBQXpCO0lBOUQyQyxDQUE3QztFQS9Sc0IsQ0FBeEI7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgZGlzcGF0Y2gsIFRleHREYXRhfSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuZGVzY3JpYmUgXCJNb3Rpb24gRmluZFwiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBzZXR0aW5ncy5zZXQoJ3VzZUV4cGVyaW1lbnRhbEZhc3RlcklucHV0JywgdHJ1ZSlcbiAgICAjIGphc21pbmUuYXR0YWNoVG9ET00oYXRvbS53b3Jrc3BhY2UuZ2V0RWxlbWVudCgpKVxuXG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCBfdmltKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZSAjIHRvIHJlZmVyIGFzIHZpbVN0YXRlIGxhdGVyLlxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gX3ZpbVxuXG4gIHhkZXNjcmliZSAndGhlIGYgcGVyZm9ybWFuY2UnLCAtPlxuICAgIHRpbWVzVG9FeGVjdXRlID0gNTAwXG4gICAgIyB0aW1lc1RvRXhlY3V0ZSA9IDFcbiAgICBtZWFzdXJlV2l0aFRpbWVFbmQgPSAoZm4pIC0+XG4gICAgICBjb25zb2xlLnRpbWUoZm4ubmFtZSlcbiAgICAgIGZuKClcbiAgICAgICMgY29uc29sZS5sb2cgXCJbdGltZS1lbmRdXCJcbiAgICAgIGNvbnNvbGUudGltZUVuZChmbi5uYW1lKVxuXG4gICAgbWVhc3VyZVdpdGhQZXJmb3JtYW5jZU5vdyA9IChmbikgLT5cbiAgICAgIHQwID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIGZuKClcbiAgICAgIHQxID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgIGNvbnNvbGUubG9nIFwiW3BlcmZvcm1hbmNlLm5vd10gdG9vayAje3QxIC0gdDB9IG1zZWNcIlxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiICBcIiArIFwibFwiLnJlcGVhdCh0aW1lc1RvRXhlY3V0ZSlcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIHhkZXNjcmliZSAndGhlIGYgcmVhZC1jaGFyLXZpYS1rZXliaW5kaW5nIHBlcmZvcm1hbmNlJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgdmltU3RhdGUudXNlTWluaUVkaXRvciA9IGZhbHNlXG5cbiAgICAgIGl0ICdbd2l0aCBrZXliaW5kXSBtb3ZlcyB0byBsIGNoYXInLCAtPlxuICAgICAgICB0ZXN0UGVyZm9ybWFuY2VPZktleWJpbmQgPSAtPlxuICAgICAgICAgIGtleXN0cm9rZSBcImYgbFwiIGZvciBuIGluIFsxLi50aW1lc1RvRXhlY3V0ZV1cbiAgICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgdGltZXNUb0V4ZWN1dGUgKyAxXVxuXG4gICAgICAgIGNvbnNvbGUubG9nIFwiPT0ga2V5YmluZFwiXG4gICAgICAgIGVuc3VyZSBcImYgbFwiLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgbWVhc3VyZVdpdGhUaW1lRW5kKHRlc3RQZXJmb3JtYW5jZU9mS2V5YmluZClcbiAgICAgICAgIyBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgIyBtZWFzdXJlV2l0aFBlcmZvcm1hbmNlTm93KHRlc3RQZXJmb3JtYW5jZU9mS2V5YmluZClcblxuICAgIGRlc2NyaWJlICdbd2l0aCBoaWRkZW4taW5wdXRdIG1vdmVzIHRvIGwgY2hhcicsIC0+XG4gICAgICBpdCAnW3dpdGggaGlkZGVuLWlucHV0XSBtb3ZlcyB0byBsIGNoYXInLCAtPlxuICAgICAgICB0ZXN0UGVyZm9ybWFuY2VPZkhpZGRlbklucHV0ID0gLT5cbiAgICAgICAgICBrZXlzdHJva2UgJ2YgbCcgZm9yIG4gaW4gWzEuLnRpbWVzVG9FeGVjdXRlXVxuICAgICAgICAgIGVuc3VyZSBjdXJzb3I6IFswLCB0aW1lc1RvRXhlY3V0ZSArIDFdXG5cbiAgICAgICAgY29uc29sZS5sb2cgXCI9PSBoaWRkZW5cIlxuICAgICAgICBlbnN1cmUgJ2YgbCcsIGN1cnNvcjogWzAsIDJdXG5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIG1lYXN1cmVXaXRoVGltZUVuZCh0ZXN0UGVyZm9ybWFuY2VPZkhpZGRlbklucHV0KVxuICAgICAgICAjIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAjIG1lYXN1cmVXaXRoUGVyZm9ybWFuY2VOb3codGVzdFBlcmZvcm1hbmNlT2ZIaWRkZW5JbnB1dClcblxuICBkZXNjcmliZSAndGhlIGYvRiBrZXliaW5kaW5ncycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiYWJjYWJjYWJjYWJjXFxuXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGl0ICdtb3ZlcyB0byB0aGUgZmlyc3Qgc3BlY2lmaWVkIGNoYXJhY3RlciBpdCBmaW5kcycsIC0+XG4gICAgICBlbnN1cmUgJ2YgYycsIGN1cnNvcjogWzAsIDJdXG5cbiAgICBpdCAnZXh0ZW5kcyB2aXN1YWwgc2VsZWN0aW9uIGluIHZpc3VhbC1tb2RlIGFuZCByZXBldGFibGUnLCAtPlxuICAgICAgZW5zdXJlICd2JywgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICBlbnN1cmUgJ2YgYycsIHNlbGVjdGVkVGV4dDogJ2FiYycsIGN1cnNvcjogWzAsIDNdXG4gICAgICBlbnN1cmUgJzsnLCBzZWxlY3RlZFRleHQ6ICdhYmNhYmMnLCBjdXJzb3I6IFswLCA2XVxuICAgICAgZW5zdXJlICcsJywgc2VsZWN0ZWRUZXh0OiAnYWJjJywgY3Vyc29yOiBbMCwgM11cblxuICAgIGl0ICdtb3ZlcyBiYWNrd2FyZHMgdG8gdGhlIGZpcnN0IHNwZWNpZmllZCBjaGFyYWN0ZXIgaXQgZmluZHMnLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDJdXG4gICAgICBlbnN1cmUgJ0YgYScsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCAncmVzcGVjdHMgY291bnQgZm9yd2FyZCcsIC0+XG4gICAgICBlbnN1cmUgJzIgZiBhJywgY3Vyc29yOiBbMCwgNl1cblxuICAgIGl0ICdyZXNwZWN0cyBjb3VudCBiYWNrd2FyZCcsIC0+XG4gICAgICBjdXJzb3I6IFswLCA2XVxuICAgICAgZW5zdXJlICcyIEYgYScsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcImRvZXNuJ3QgbW92ZSBpZiB0aGUgY2hhcmFjdGVyIHNwZWNpZmllZCBpc24ndCBmb3VuZFwiLCAtPlxuICAgICAgZW5zdXJlICdmIGQnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgXCJkb2Vzbid0IG1vdmUgaWYgdGhlcmUgYXJlbid0IHRoZSBzcGVjaWZpZWQgY291bnQgb2YgdGhlIHNwZWNpZmllZCBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgIGVuc3VyZSAnMSAwIGYgYScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAjIGEgYnVnIHdhcyBtYWtpbmcgdGhpcyBiZWhhdmlvdXIgZGVwZW5kIG9uIHRoZSBjb3VudFxuICAgICAgZW5zdXJlICcxIDEgZiBhJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICMgYW5kIGJhY2t3YXJkcyBub3dcbiAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgZW5zdXJlICcxIDAgRiBhJywgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnMSAxIEYgYScsIGN1cnNvcjogWzAsIDZdXG5cbiAgICBpdCBcImNvbXBvc2VzIHdpdGggZFwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICBlbnN1cmUgJ2QgMiBmIGEnLCB0ZXh0OiAnYWJjYmNcXG4nXG5cbiAgICBpdCBcIkYgYmVoYXZlcyBleGNsdXNpdmVseSB3aGVuIGNvbXBvc2VzIHdpdGggb3BlcmF0b3JcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICdkIEYgYScsIHRleHQ6ICdhYmNhYmNhYmNcXG4nXG5cbiAgZGVzY3JpYmUgJ3RoZSB0L1Qga2V5YmluZGluZ3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcImFiY2FiY2FiY2FiY1xcblwiXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCAnbW92ZXMgdG8gdGhlIGNoYXJhY3RlciBwcmV2aW91cyB0byB0aGUgZmlyc3Qgc3BlY2lmaWVkIGNoYXJhY3RlciBpdCBmaW5kcycsIC0+XG4gICAgICBlbnN1cmUgJ3QgYScsIGN1cnNvcjogWzAsIDJdXG4gICAgICAjIG9yIHN0YXlzIHB1dCB3aGVuIGl0J3MgYWxyZWFkeSB0aGVyZVxuICAgICAgZW5zdXJlICd0IGEnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgaXQgJ21vdmVzIGJhY2t3YXJkcyB0byB0aGUgY2hhcmFjdGVyIGFmdGVyIHRoZSBmaXJzdCBzcGVjaWZpZWQgY2hhcmFjdGVyIGl0IGZpbmRzJywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICdUIGEnLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgaXQgJ3Jlc3BlY3RzIGNvdW50IGZvcndhcmQnLCAtPlxuICAgICAgZW5zdXJlICcyIHQgYScsIGN1cnNvcjogWzAsIDVdXG5cbiAgICBpdCAncmVzcGVjdHMgY291bnQgYmFja3dhcmQnLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDZdXG4gICAgICBlbnN1cmUgJzIgVCBhJywgY3Vyc29yOiBbMCwgMV1cblxuICAgIGl0IFwiZG9lc24ndCBtb3ZlIGlmIHRoZSBjaGFyYWN0ZXIgc3BlY2lmaWVkIGlzbid0IGZvdW5kXCIsIC0+XG4gICAgICBlbnN1cmUgJ3QgZCcsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcImRvZXNuJ3QgbW92ZSBpZiB0aGVyZSBhcmVuJ3QgdGhlIHNwZWNpZmllZCBjb3VudCBvZiB0aGUgc3BlY2lmaWVkIGNoYXJhY3RlclwiLCAtPlxuICAgICAgZW5zdXJlICcxIDAgdCBkJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICMgYSBidWcgd2FzIG1ha2luZyB0aGlzIGJlaGF2aW91ciBkZXBlbmQgb24gdGhlIGNvdW50XG4gICAgICBlbnN1cmUgJzEgMSB0IGEnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgIyBhbmQgYmFja3dhcmRzIG5vd1xuICAgICAgc2V0IGN1cnNvcjogWzAsIDZdXG4gICAgICBlbnN1cmUgJzEgMCBUIGEnLCBjdXJzb3I6IFswLCA2XVxuICAgICAgZW5zdXJlICcxIDEgVCBhJywgY3Vyc29yOiBbMCwgNl1cblxuICAgIGl0IFwiY29tcG9zZXMgd2l0aCBkXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgM11cbiAgICAgIGVuc3VyZSAnZCAyIHQgYicsXG4gICAgICAgIHRleHQ6ICdhYmNiY2FiY1xcbidcblxuICAgIGl0IFwiZGVsZXRlIGNoYXIgdW5kZXIgY3Vyc29yIGV2ZW4gd2hlbiBubyBtb3ZlbWVudCBoYXBwZW5zIHNpbmNlIGl0J3MgaW5jbHVzaXZlIG1vdGlvblwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICBlbnN1cmUgJ2QgdCBiJyxcbiAgICAgICAgdGV4dDogJ2JjYWJjYWJjYWJjXFxuJ1xuICAgIGl0IFwiZG8gbm90aGluZyB3aGVuIGluY2x1c2l2ZW5lc3MgaW52ZXJ0ZWQgYnkgdiBvcGVyYXRvci1tb2RpZmllclwiLCAtPlxuICAgICAgdGV4dDogXCJhYmNhYmNhYmNhYmNcXG5cIlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICBlbnN1cmUgJ2QgdiB0IGInLFxuICAgICAgICB0ZXh0OiAnYWJjYWJjYWJjYWJjXFxuJ1xuXG4gICAgaXQgXCJUIGJlaGF2ZXMgZXhjbHVzaXZlbHkgd2hlbiBjb21wb3NlcyB3aXRoIG9wZXJhdG9yXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgM11cbiAgICAgIGVuc3VyZSAnZCBUIGInLFxuICAgICAgICB0ZXh0OiAnYWJhYmNhYmNhYmNcXG4nXG5cbiAgICBpdCBcIlQgZG9uJ3QgZGVsZXRlIGNoYXJhY3RlciB1bmRlciBjdXJzb3IgZXZlbiB3aGVuIG5vIG1vdmVtZW50IGhhcHBlbnNcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICdkIFQgYycsXG4gICAgICAgIHRleHQ6ICdhYmNhYmNhYmNhYmNcXG4nXG5cbiAgZGVzY3JpYmUgJ3RoZSA7IGFuZCAsIGtleWJpbmRpbmdzJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJhYmNhYmNhYmNhYmNcXG5cIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgXCJyZXBlYXQgZiBpbiBzYW1lIGRpcmVjdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICdmIGMnLCBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgNV1cbiAgICAgIGVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDhdXG5cbiAgICBpdCBcInJlcGVhdCBGIGluIHNhbWUgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMTBdXG4gICAgICBlbnN1cmUgJ0YgYycsIGN1cnNvcjogWzAsIDhdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgMl1cblxuICAgIGl0IFwicmVwZWF0IGYgaW4gb3Bwb3NpdGUgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnZiBjJywgY3Vyc29yOiBbMCwgOF1cbiAgICAgIGVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDVdXG4gICAgICBlbnN1cmUgJywnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgaXQgXCJyZXBlYXQgRiBpbiBvcHBvc2l0ZSBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgZW5zdXJlICdGIGMnLCBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgNV1cbiAgICAgIGVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDhdXG5cbiAgICBpdCBcImFsdGVybmF0ZSByZXBlYXQgZiBpbiBzYW1lIGRpcmVjdGlvbiBhbmQgcmV2ZXJzZVwiLCAtPlxuICAgICAgZW5zdXJlICdmIGMnLCBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgNV1cbiAgICAgIGVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDJdXG5cbiAgICBpdCBcImFsdGVybmF0ZSByZXBlYXQgRiBpbiBzYW1lIGRpcmVjdGlvbiBhbmQgcmV2ZXJzZVwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDEwXVxuICAgICAgZW5zdXJlICdGIGMnLCBjdXJzb3I6IFswLCA4XVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgNV1cbiAgICAgIGVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDhdXG5cbiAgICBpdCBcInJlcGVhdCB0IGluIHNhbWUgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBlbnN1cmUgJ3QgYycsIGN1cnNvcjogWzAsIDFdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA0XVxuXG4gICAgaXQgXCJyZXBlYXQgVCBpbiBzYW1lIGRpcmVjdGlvblwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDEwXVxuICAgICAgZW5zdXJlICdUIGMnLCBjdXJzb3I6IFswLCA5XVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgNl1cblxuICAgIGl0IFwicmVwZWF0IHQgaW4gb3Bwb3NpdGUgZGlyZWN0aW9uIGZpcnN0LCBhbmQgdGhlbiByZXZlcnNlXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgM11cbiAgICAgIGVuc3VyZSAndCBjJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgIGVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDNdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA0XVxuXG4gICAgaXQgXCJyZXBlYXQgVCBpbiBvcHBvc2l0ZSBkaXJlY3Rpb24gZmlyc3QsIGFuZCB0aGVuIHJldmVyc2VcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgZW5zdXJlICdUIGMnLCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgIGVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDNdXG5cbiAgICBpdCBcInJlcGVhdCB3aXRoIGNvdW50IGluIHNhbWUgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSAnZiBjJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgIGVuc3VyZSAnMiA7JywgY3Vyc29yOiBbMCwgOF1cblxuICAgIGl0IFwicmVwZWF0IHdpdGggY291bnQgaW4gcmV2ZXJzZSBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgZW5zdXJlICdmIGMnLCBjdXJzb3I6IFswLCA4XVxuICAgICAgZW5zdXJlICcyICwnLCBjdXJzb3I6IFswLCAyXVxuXG4gIGRlc2NyaWJlIFwibGFzdCBmaW5kL3RpbGwgaXMgcmVwZWF0YWJsZSBvbiBvdGhlciBlZGl0b3JcIiwgLT5cbiAgICBbb3RoZXIsIG90aGVyRWRpdG9yLCBwYW5lXSA9IFtdXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgZ2V0VmltU3RhdGUgKG90aGVyVmltU3RhdGUsIF9vdGhlcikgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJhIGJheiBiYXJcXG5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgICAgb3RoZXIgPSBfb3RoZXJcbiAgICAgICAgb3RoZXIuc2V0XG4gICAgICAgICAgdGV4dDogXCJmb28gYmFyIGJhelwiLFxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIG90aGVyRWRpdG9yID0gb3RoZXJWaW1TdGF0ZS5lZGl0b3JcbiAgICAgICAgIyBqYXNtaW5lLmF0dGFjaFRvRE9NKG90aGVyRWRpdG9yLmVsZW1lbnQpXG5cbiAgICAgICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgICAgICBwYW5lLmFjdGl2YXRlSXRlbShlZGl0b3IpXG5cbiAgICBpdCBcInNoYXJlcyB0aGUgbW9zdCByZWNlbnQgZmluZC90aWxsIGNvbW1hbmQgd2l0aCBvdGhlciBlZGl0b3JzXCIsIC0+XG4gICAgICBlbnN1cmUgJ2YgYicsIGN1cnNvcjogWzAsIDJdXG4gICAgICBvdGhlci5lbnN1cmUgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgIyByZXBsYXkgc2FtZSBmaW5kIGluIHRoZSBvdGhlciBlZGl0b3JcbiAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKG90aGVyRWRpdG9yKVxuICAgICAgb3RoZXIua2V5c3Ryb2tlICc7J1xuICAgICAgZW5zdXJlIGN1cnNvcjogWzAsIDJdXG4gICAgICBvdGhlci5lbnN1cmUgY3Vyc29yOiBbMCwgNF1cblxuICAgICAgIyBkbyBhIHRpbGwgaW4gdGhlIG90aGVyIGVkaXRvclxuICAgICAgb3RoZXIua2V5c3Ryb2tlICd0IHInXG4gICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgMl1cbiAgICAgIG90aGVyLmVuc3VyZSBjdXJzb3I6IFswLCA1XVxuXG4gICAgICAjIGFuZCByZXBsYXkgaW4gdGhlIG5vcm1hbCBlZGl0b3JcbiAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKGVkaXRvcilcbiAgICAgIGVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDddXG4gICAgICBvdGhlci5lbnN1cmUgY3Vyc29yOiBbMCwgNV1cblxuICAgIGl0IFwiaXMgc3RpbGwgcmVwZWF0YWJsZSBhZnRlciBvcmlnaW5hbCBlZGl0b3Igd2FzIGRlc3Ryb3llZFwiLCAtPlxuICAgICAgZW5zdXJlICdmIGInLCBjdXJzb3I6IFswLCAyXVxuICAgICAgb3RoZXIuZW5zdXJlIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKG90aGVyRWRpdG9yKVxuICAgICAgZWRpdG9yLmRlc3Ryb3koKVxuICAgICAgZXhwZWN0KGVkaXRvci5pc0FsaXZlKCkpLnRvQmUoZmFsc2UpXG4gICAgICBvdGhlci5lbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgb3RoZXIuZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgOF1cbiAgICAgIG90aGVyLmVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDRdXG5cbiAgZGVzY3JpYmUgXCJ2bXAgdW5pcXVlIGZlYXR1cmUgb2YgYGZgIGZhbWlseVwiLCAtPlxuICAgIGRlc2NyaWJlIFwiaWdub3JlQ2FzZUZvckZpbmRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KFwiaWdub3JlQ2FzZUZvckZpbmRcIiwgdHJ1ZSlcblxuICAgICAgaXQgXCJpZ25vcmUgY2FzZSB0byBmaW5kXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0QzogXCJ8ICAgIEEgICAgYWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiZiBhXCIsIHRleHRDOiBcIiAgICB8QSAgICBhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiICAgIEEgICAgfGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgICB8YSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIGEgICAgfEFiICAgIGFcIlxuXG4gICAgZGVzY3JpYmUgXCJ1c2VTbWFydGNhc2VGb3JGaW5kXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldHRpbmdzLnNldChcInVzZVNtYXJ0Y2FzZUZvckZpbmRcIiwgdHJ1ZSlcblxuICAgICAgaXQgXCJpZ25vcmUgY2FzZSB3aGVuIGlucHV0IGlzIGxvd2VyIGNoYXJcIiwgLT5cbiAgICAgICAgc2V0IHRleHRDOiBcInwgICAgQSAgICBhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJmIGFcIiwgdGV4dEM6IFwiICAgIHxBICAgIGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIgICAgQSAgICB8YWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIHxhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgYSAgICB8QWIgICAgYVwiXG5cbiAgICAgIGl0IFwiZmluZCBjYXNlLXNlbnNpdGl2ZWx5IHdoZW4gaW5wdXQgaXMgbGFnZXIgY2hhclwiLCAtPlxuICAgICAgICBzZXQgdGV4dEM6IFwifCAgICBBICAgIGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcImYgQVwiLCB0ZXh0QzogXCIgICAgfEEgICAgYWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiZiBBXCIsIHRleHRDOiBcIiAgICBBICAgIGFiICAgIGEgICAgfEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCIsXCIsICAgdGV4dEM6IFwiICAgIHxBICAgIGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgICBhICAgIHxBYiAgICBhXCJcblxuICAgIGRlc2NyaWJlIFwicmV1c2VGaW5kRm9yUmVwZWF0RmluZFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoXCJyZXVzZUZpbmRGb3JSZXBlYXRGaW5kXCIsIHRydWUpXG5cbiAgICAgIGl0IFwiY2FuIHJldXNlIGYgYW5kIHQgYXMgOywgRiBhbmQgVCBhcyAnLCcgcmVzcGVjdGl2ZWx5XCIsIC0+XG4gICAgICAgIHNldCB0ZXh0QzogXCJ8ICAgIEEgICAgYWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiZiBhXCIsIHRleHRDOiBcIiAgICBBICAgIHxhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJmXCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgfGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcImZcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgICBhICAgIEFiICAgIHxhXCJcbiAgICAgICAgZW5zdXJlIFwiRlwiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIHxhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJGXCIsICAgdGV4dEM6IFwiICAgIEEgICAgfGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcInRcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgIHwgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwidFwiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIGEgICAgQWIgICB8IGFcIlxuICAgICAgICBlbnN1cmUgXCJUXCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgYXwgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIlRcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhfGIgICAgYSAgICBBYiAgICBhXCJcblxuICAgIGRlc2NyaWJlIFwiZmluZEFjcm9zc0xpbmVzXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldHRpbmdzLnNldChcImZpbmRBY3Jvc3NMaW5lc1wiLCB0cnVlKVxuXG4gICAgICBpdCBcInNlYXJjaGVzIGFjcm9zcyBtdWx0aXBsZSBsaW5lc1wiLCAtPlxuICAgICAgICBzZXQgICAgICAgICAgIHRleHRDOiBcInwwOiAgICBhICAgIGFcXG4xOiAgICBhICAgIGFcXG4yOiAgICBhICAgIGFcXG5cIlxuICAgICAgICBlbnN1cmUgXCJmIGFcIiwgdGV4dEM6IFwiMDogICAgfGEgICAgYVxcbjE6ICAgIGEgICAgYVxcbjI6ICAgIGEgICAgYVxcblwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIwOiAgICBhICAgIHxhXFxuMTogICAgYSAgICBhXFxuMjogICAgYSAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIjA6ICAgIGEgICAgYVxcbjE6ICAgIHxhICAgIGFcXG4yOiAgICBhICAgIGFcXG5cIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiMDogICAgYSAgICBhXFxuMTogICAgYSAgICB8YVxcbjI6ICAgIGEgICAgYVxcblwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIwOiAgICBhICAgIGFcXG4xOiAgICBhICAgIGFcXG4yOiAgICB8YSAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwiRiBhXCIsIHRleHRDOiBcIjA6ICAgIGEgICAgYVxcbjE6ICAgIGEgICAgfGFcXG4yOiAgICBhICAgIGFcXG5cIlxuICAgICAgICBlbnN1cmUgXCJ0IGFcIiwgdGV4dEM6IFwiMDogICAgYSAgICBhXFxuMTogICAgYSAgICBhXFxuMjogICB8IGEgICAgYVxcblwiXG4gICAgICAgIGVuc3VyZSBcIlQgYVwiLCB0ZXh0QzogXCIwOiAgICBhICAgIGFcXG4xOiAgICBhICAgIHxhXFxuMjogICAgYSAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwiVCBhXCIsIHRleHRDOiBcIjA6ICAgIGEgICAgYVxcbjE6ICAgIGF8ICAgIGFcXG4yOiAgICBhICAgIGFcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJmaW5kQ2hhcnNNYXhcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgIyBUbyBwYXNzIGhsRmluZCBsb2dpYyBpdCByZXF1aXJlIFwidmlzaWJsZVwiIHNjcmVlbiByYW5nZS5cbiAgICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShhdG9tLndvcmtzcGFjZS5nZXRFbGVtZW50KCkpXG5cbiAgICAgIGRlc2NyaWJlIFwid2l0aCAyIGxlbmd0aFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0KFwiZmluZENoYXJzTWF4XCIsIDIpXG5cbiAgICAgICAgZGVzY3JpYmUgXCJjYW4gZmluZCBvbmUgb3IgdHdvIGNoYXJcIiwgLT5cbiAgICAgICAgICBpdCBcImNhbiBmaW5kIGJ5IHR3byBjaGFyXCIsIC0+XG4gICAgICAgICAgICBzZXQgICAgICAgICAgICAgdGV4dEM6IFwifCAgICBhICAgIGFiICAgIGEgICAgY2QgICAgYVwiXG4gICAgICAgICAgICBlbnN1cmUgXCJmIGEgYlwiLCB0ZXh0QzogXCIgICAgYSAgICB8YWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgYyBkXCIsIHRleHRDOiBcIiAgICBhICAgIGFiICAgIGEgICAgfGNkICAgIGFcIlxuXG4gICAgICAgICAgaXQgXCJjYW4gZmluZCBieSBvbmUtY2hhciBieSBjb25maXJtaW5nIGV4cGxpY2l0bHlcIiwgLT5cbiAgICAgICAgICAgIHNldCAgICAgICAgICAgICAgICAgdGV4dEM6IFwifCAgICBhICAgIGFiICAgIGEgICAgY2QgICAgYVwiXG4gICAgICAgICAgICBlbnN1cmUgXCJmIGEgZW50ZXJcIiwgdGV4dEM6IFwiICAgIHxhICAgIGFiICAgIGEgICAgY2QgICAgYVwiXG4gICAgICAgICAgICBlbnN1cmUgXCJmIGMgZW50ZXJcIiwgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgYSAgICB8Y2QgICAgYVwiXG5cbiAgICAgIGRlc2NyaWJlIFwid2l0aCAzIGxlbmd0aFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0KFwiZmluZENoYXJzTWF4XCIsIDMpXG5cbiAgICAgICAgZGVzY3JpYmUgXCJjYW4gZmluZCAzIGF0IG1heGltdW1cIiwgLT5cbiAgICAgICAgICBpdCBcImNhbiBmaW5kIGJ5IG9uZSBvciB0d28gb3IgdGhyZWUgY2hhclwiLCAtPlxuICAgICAgICAgICAgc2V0ICAgICAgICAgICAgICAgICAgIHRleHRDOiBcInwgICAgYSAgICBhYiAgICBhICAgIGNkICAgIGVmZ1wiXG4gICAgICAgICAgICBlbnN1cmUgXCJmIGEgYiBlbnRlclwiLCB0ZXh0QzogXCIgICAgYSAgICB8YWIgICAgYSAgICBjZCAgICBlZmdcIlxuICAgICAgICAgICAgZW5zdXJlIFwiZiBhIGVudGVyXCIsICAgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgfGEgICAgY2QgICAgZWZnXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgYyBkIGVudGVyXCIsIHRleHRDOiBcIiAgICBhICAgIGFiICAgIGEgICAgfGNkICAgIGVmZ1wiXG4gICAgICAgICAgICBlbnN1cmUgXCJmIGUgZiBnXCIsICAgICB0ZXh0QzogXCIgICAgYSAgICBhYiAgICBhICAgIGNkICAgIHxlZmdcIlxuXG4gICAgICBkZXNjcmliZSBcImF1dG9Db25maXJtVGltZW91dFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0KFwiZmluZENoYXJzTWF4XCIsIDIpXG4gICAgICAgICAgc2V0dGluZ3Muc2V0KFwiZmluZENvbmZpcm1CeVRpbWVvdXRcIiwgNTAwKVxuXG4gICAgICAgIGl0IFwiYXV0by1jb25maXJtIHNpbmdsZS1jaGFyIGlucHV0IG9uIHRpbWVvdXRcIiwgLT5cbiAgICAgICAgICBzZXQgICAgICAgICAgICAgdGV4dEM6IFwifCAgICBhICAgIGFiICAgIGEgICAgY2QgICAgYVwiXG5cbiAgICAgICAgICBlbnN1cmUgXCJmIGFcIiwgICB0ZXh0QzogXCJ8ICAgIGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICBhZHZhbmNlQ2xvY2soNTAwKVxuICAgICAgICAgIGVuc3VyZSAgICAgICAgICB0ZXh0QzogXCIgICAgfGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcblxuICAgICAgICAgIGVuc3VyZSBcImYgYyBkXCIsIHRleHRDOiBcIiAgICBhICAgIGFiICAgIGEgICAgfGNkICAgIGFcIlxuXG4gICAgICAgICAgZW5zdXJlIFwiZiBhXCIsICAgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgYSAgICB8Y2QgICAgYVwiXG4gICAgICAgICAgYWR2YW5jZUNsb2NrKDUwMClcbiAgICAgICAgICBlbnN1cmUgICAgICAgICAgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgYSAgICBjZCAgICB8YVwiXG5cbiAgICAgICAgICBlbnN1cmUgXCJGIGJcIiwgICB0ZXh0QzogXCIgICAgYSAgICBhYiAgICBhICAgIGNkICAgIHxhXCJcbiAgICAgICAgICBhZHZhbmNlQ2xvY2soNTAwKVxuICAgICAgICAgIGVuc3VyZSAgICAgICAgICB0ZXh0QzogXCIgICAgYSAgICBhfGIgICAgYSAgICBjZCAgICBhXCJcbiJdfQ==
